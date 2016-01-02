'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){


    return this.show(JSON.stringify({
      project: this.get('project'),
      path: this.get('subPath')
    }));
  }



}