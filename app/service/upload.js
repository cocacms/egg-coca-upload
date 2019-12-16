'use strict';
const Service = require('egg').Service;

const path = require('path');
const fs = require('fs');
const qiniu = require('qiniu');

class Upload extends Service {
  async upload() {
    const config = this.config.upload;
    if (config.dirver === 'local') {
      return await this.local();
    }

    if (config.dirver === 'qiniu') {
      return await this.qiniu();
    }
  }

  async local() {
    const { ctx } = this;
    const file = ctx.request.files[0];
    const name = path.basename(file.filepath);

    fs.renameSync(
      file.filepath,
      path.resolve(this.app.baseDir, `./app/public/${name}`)
    );

    return { url: `${ctx.protocol}://${ctx.host}/public/${name}` };
  }

  async qiniu() {
    const config = this.config.upload;

    const mac = new qiniu.auth.digest.Mac(
      config.qiniu.AccessKey,
      config.qiniu.SecretKey
    );

    const options = {
      scope: config.qiniu.Bucket,
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const token = putPolicy.uploadToken(mac);

    return {
      token,
      host: config.qiniu.Host,
      cdn: config.qiniu.Cdn,
    };
  }
}

module.exports = Upload;
