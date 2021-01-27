const Generator = require('yeoman-generator');
const download = require('download-git-repo');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const boxen = require('boxen');
const pkg = require('../../package.json');

const BOXEN_OPTS = {
    padding: 1,
    margin: 1,
    align: 'center',
    borderColor: 'yellow',
    borderStyle: 'round'
};

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
    }

    // initial
    initializing() {
        this.log();
        const version = `(v${pkg.version})`;
        const messages = [];
        messages.push(`💁 Welcome to use Generator-vue ${chalk.grey(version)}`);
        messages.push(chalk.yellow('You can create a frontend project very quickly.'));
        this.log(boxen(messages.join('\n'), {...BOXEN_OPTS, ...{ borderColor: 'green', borderStyle: 'doubleSingle' }}));
    }

    // prompting
    async prompting() {
        const done = this.async();
        const opts = [{
            type: 'input',
            name: 'dirName',
            message: 'Please enter the directory name for your project：',
            default: 'vue-app',
            validate: dirName => {
                if (dirName.length < 1) {
                    return '⚠️  directory name must not be null！';
                }
                return true;
            }
        }];
        return this.prompt(opts).then(({dirName}) => {
            this.dirName = dirName;
            done();
        });
    }

    // writing
    _downloadTemplate() {
        return new Promise((resolve, reject) => {
            const dirPath = this.destinationPath(this.dirName, '.tmp');
            download('alienzhou/webpack-kickoff-template', dirPath, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    _templateCopy(filePath, templateRoot) {
        if (fs.statSync(filePath).isDirectory()) {
            fs.readdirSync(filePath).forEach(name => {
                this._templateCopy(path.resolve(filePath, name), templateRoot);
            });
            return;
        }
        const relativePath = path.relative(templateRoot, filePath);
        const destination = this.destinationPath(this.dirName, relativePath);
        this.fs.copyTpl(filePath, destination, {
            dirName: this.dirName
        });
    }
    writing() {
        const done = this.async();
        this._downloadTemplate().then(() => {
            const templateRoot = this.destinationPath(this.dirName, '.tmp');
            this._templateCopy(templateRoot, templateRoot);
            fs.removeSync(templateRoot);
            done();
        }).catch(err => {
            this.env.error(err);
        });
    }

    // install
    install() {
        this.log();
        this.log('📂 Finish generating the project template and configuration.', chalk.green('✔'));
        this.log();
        this.log('📦 Install dependencies...');

        this.npmInstall('', {}, {
            cwd: this.destinationPath(this.dirName)
        });
    }

    // end
    end() {
        this.log('📦 Finish installing dependencies.', chalk.green('✔'));
        const dir = chalk.green(this.dirName);
        const messages = [];
        messages.push(`🎊 You can start the project following these steps:`);
        messages.push(chalk.green(`cd ${dir}`));
        messages.push(chalk.green('npm run serve'));
        this.log();
        this.log(
            boxen(messages.join('\n'), {
                ...BOXEN_OPTS,
                ...{
                    borderColor: 'white'
                }
            })
        );
    }
}