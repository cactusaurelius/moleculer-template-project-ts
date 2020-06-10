const Generator = require('yeoman-generator');
const Config = require('./config').default;
const fs = require('fs');
const path = require('path');

class GeneratorComponent extends Generator {
  constructor(args, options) {
    super(args, { ...options, ...Config.options });
    this.serviceName = 'test';
    this.needDB = true;
  }

  capitalize(value) {
    if (!value) {
      return '';
    }
    return value.substr(0, 1).toUpperCase() + value.substr(1, value.length);
  }

  get canonical() {
    return this.serviceName && this.serviceName.split('-').map(this.capitalize).join('');
  }

  get canonicalLower() {
    return this.canonical && this.canonical[0].toLowerCase() + this.canonical.slice(1);
  }

  prompting() {
    return this.prompt(Config.prompts()).then((answers) => {
      if (Object.prototype.hasOwnProperty.call(answers, 'service_name')) {
        this.serviceName = answers['service_name'];
      }
      if (Object.prototype.hasOwnProperty.call(answers, 'need_db')) {
        this.needDB = !!answers['need_db'];
      }
    });
  }

  writing() {
    const templateData = {
      serviceName: this.serviceName || '',
      canonicalName: this.canonical || '',
      canonicalLower: this.canonicalLower || '',
      uppercaseName: this.serviceName.toUpperCase() || '',
      needDB: !!this.needDB
    };
    Config.files.filter((f) => this.needDB || (!this.needDB && !f.needDB)).forEach(({ dir, index, files }) => {
      files.forEach((file) => {
        this.copyMoleculerFiles(templateData, { dir, index, file });
      });
    });
    this.addErrors(templateData, { dir: 'src/types', file: 'errors.ts' });
  }

  copyMoleculerFiles(data, info = {}) {
    const { dir, index, file } = info;
    if (!file || !file.input || !file.output || !data || !data.serviceName) {
      return;
    }
    const output = file.output.replace('{serviceName}', data.serviceName);
    const destinationPath = this.destinationPath(path.join(dir, output));
    this.fs.copyTpl(this.templatePath(file.input), destinationPath, data);
    if (index) {
      this.addFileToIndex(data, { dir, index, file: destinationPath });
    }
  }

  addFileToIndex(data, info = {}) {
    const { dir, index, file } = info;
    if (!dir || !index || !file) {
      return;
    }
    const destinationIndex = this.destinationPath(path.join(dir, index));
    if (!fs.existsSync(destinationIndex)) {
      return;
    }
    let route = path.relative(path.dirname(destinationIndex), file).replace(/\.ts$/, '');
    if (!route.startsWith('.')) {
      route = `./${route}`;
    }
    let indexContent = this.fs.read(destinationIndex);
    const component = `export * from '${route}';`;
    const componentEntity = `export { I${data.canonicalName} } from '../entities/${data.canonicalLower}.entity';`
    if (!indexContent.includes(component)) {
      indexContent += `${component}\n`;
      if (dir === 'src/types' && data.needDB) {
        indexContent += `${componentEntity}\n`;
      }
      this.fs.write(destinationIndex, indexContent.replace(/\n\n/g, '\n'));
    }
  }

  addErrors(data, info = {}) {
    const { dir, file } = info;
    if (!dir || !file) {
      return;
    }
    const destinationErrors = this.destinationPath(path.join(dir, file));
    if (!fs.existsSync(destinationErrors)) {
      return;
    }
    let content = this.fs.read(destinationErrors);
    const errorHeader = [`export enum ${data.canonicalLower}ErrorMessage {`];
    if (content.includes(errorHeader)) {
      return;
    }
    errorHeader.push(`  NOT_FOUND = '${data.canonicalLower}.notfound',`, `  DUPLICATED = '${data.canonicalLower}.duplicated'`, '}\n');
    errorHeader.push(`export const ${data.canonicalLower}ErrorCode = {`, '  NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,', '  DUPLICATED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY', '};');
    content += `\n${errorHeader.join('\n')}\n`;
    this.fs.write(destinationErrors, content);
  }

}

exports.default = GeneratorComponent;
