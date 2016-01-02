'use strict';

export default class extends think.controller.base {


  /**
   * 代替display方法
   * @param templatePath 模板路径
   * @param charset
   * @param contentType
     */
  async show(templatePath, charset, contentType){
    if(think.isObject(charset)){
      charset = '';
    }else if(think.isObject(contentType)){
      contentType = '';
    }
    try{
      await this.hook('view_before');
      let content = await this.fetchContent(templatePath);
      await this.view().render(content, charset, contentType);
      await this.hook('view_after', content);
    }catch(err){
      this.http.error = err;
      await think.statusAction(500, this.http, true);
    }
    return think.prevent();
  }



  async fetchContent(templatePath) {
    let EjsTemplate = think.adapter("template", "feps");
    let instance = new EjsTemplate();


    let content = instance.run("view/home/index_index.html");
    return content;
  }
}