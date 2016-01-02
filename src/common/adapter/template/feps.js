'use strict';
import fs from 'fs';

/**
 * base adapter
 */
export default class extends think.adapter.base {
  /**
   * merge config
   * @param  {Object} defaultConf []
   * @param  {Object} extraConf   []
   * @return {}             []
   */
  parseConfig(defaultConf, extraConf){
    let config = think.parseConfig(defaultConf, think.config('view'), extraConf);
    //compatibility with view.options
    if(!think.isEmpty(config.options)){
      think.log(colors => {
        return colors.yellow('[DEPRECATED]') + ` view.options is deprecated, use view.adapter.${config.type} instead`;
      });
      config = think.extend(config, config.options);
    }
    return config;
  }
  /**
   * pre render
   * @param  {Object}    config []
   * @param  {...[type]} args   []
   * @return {}           []
   */
  prerender(config = {}, ...args){
    if(think.isFunction(config.prerender)){
      config.prerender(...args);
    }
  }
  /**
   * get template file content
   * @return {} []
   */
  getContent(file){
    let mTime = fs.statSync(file).mtime.getTime();
    let fileCache = thinkCache(thinkCache.VIEW_CONTENT, file);
    if(fileCache && fileCache[0] >= mTime){
      return fileCache[1];
    }
    let content = fs.readFileSync(file, 'utf8');
    thinkCache(thinkCache.VIEW_CONTENT, file, [mTime, content]);
    return content;
    // let fn = think.promisify(fs.readFile, fs);
    // return fn(file, 'utf8');
  }
  /**
   * get compiled content
   * @params {String} templateFile 模版文件目录
   * @params {Object} tVar 模版变量
   * @params {Object} config 模版引擎配置
   * @return {Promise} []
   */
  async run(templateFile, tVar, config){
    let options = this.parseConfig({
      filename: templateFile,
      cache: true
    }, config);
    let ejs = await think.npm('ejs');

    this.prerender(options, ejs);

    let content = await this.getContent(templateFile);
    let _content = this.processHTML(content);
    return ejs.compile(_content, options)(tVar);
  }

  /**
   * 加工HTML
   * @param content html
   * @param dontKeepComments 不保留注释
   * @returns {string|void|XML|*}
   */
  processHTML(content, dontKeepComments) {
    var reg = /(<script(?:(?=\s)[\s\S]*?["'\s\w\/\-]>|>))([\s\S]*?)(?=<\/script\s*>|$)|(<style(?:(?=\s)[\s\S]*?["'\s\w\/\-]>|>))([\s\S]*?)(?=<\/style\s*>|$)|<(img|embed|audio|video|link|object|source)\s+[\s\S]*?["'\s\w\/\-](?:>|$)|<!--inline\[([^\]]+)\]-->|<!--(?!\[)([\s\S]*?)(-->|$)/ig;
    var callback = function(m, $1, $2, $3, $4, $5, $6, $7, $8) {
      if ($1) { //<script>
        var embed = '';
        $1 = $1.replace(/(\s(?:data-)?src\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value) {
          if (value && value.match(/\_\_inline/ig)) {
            embed += "todo 导入外部js内容";
            return '';
          } else {
            return prefix + value;
          }
        });
        if (embed) {
          //embed file
          m = $1 + embed;
        } else {
          m = $1 + $2;
        }
      } else if ($3) { //<style>
        m = $3 + $4;
      } else if ($5) { //<img|embed|audio|video|link|object|source>
        var tag = $5.toLowerCase();
        if (tag === 'link') {
          var inline = '',
              isCssLink = false,
              isImportLink = false;
          var result = m.match(/\srel\s*=\s*('[^']+'|"[^"]+"|[^\s\/>]+)/i);
          if (result && result[1]) {
            var rel = result[1].replace(/^['"]|['"]$/g, '').toLowerCase();
            isCssLink = rel === 'stylesheet';
            isImportLink = rel === 'import';
          }
          m = m.replace(/(\s(?:data-)?href\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(_, prefix, value) {
            if ((isCssLink || isImportLink) && value && value.match(/\_\_inline/ig)) {
              if (isCssLink) {
                inline += '<style' + m.substring(5).replace(/\/(?=>$)/, '').replace(/\s+(?:charset|href|data-href|hreflang|rel|rev|sizes|target)\s*=\s*(?:'[^']+'|"[^"]+"|[^\s\/>]+)/ig, '');
              }
              inline += "todo 导入外部CSS内容";
              if (isCssLink) {
                inline += '</style>';
              }
              return '';
            } else {
              return prefix + value;
            }
          });
          m = inline || m;
        } else {
          m = m.replace(/(\s(?:data-)?src(?:set)?\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value) {
            var key = (value && value.match(/\_\_inline/ig)) ? 'embed' : 'uri';
            if ( key === 'embed' ) {
              return prefix + '"base64img"';
            } else if ( key === 'uri' ) {
              return prefix + value;
            }
          });
        }
      } else if ($6) { //<!--inline[src]-->
         //什么都不做
        if (dontKeepComments) {
          m = "";
        }
      } else if ($7) { //comments
        if (dontKeepComments) {
          m = "";//移除HTML注释
        } else {
          m = '<!--' + $7 + $8; //保留注释
        }
      }
      return m;
    };
    content = content.replace(reg, callback);

    return content;
  }
}