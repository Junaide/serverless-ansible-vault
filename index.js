'use strict';

const { execSync, exec } = require('child_process');

class ServerlessAnsibleVaultPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:package:initialize': this.replaceVaultVariables.bind(this),
    };
  }

  replaceVaultVariables() {
    const vaultPath = this.serverless.service.custom.ansibleVault.path;
    const vaultPasswordFile = this.serverless.service.custom.ansibleVault.passwordFile;
    const ansibleVirtualenvPath = this.serverless.service.custom.ansibleVault.virtualenv;
    const variables = this.serverless.service.custom.ansibleVault.vars;

    const vaultVariables = {}
    const vaultRegex = /\{\{(.+?)\}\}/g;
    

    try {
    
      // attempt to enter the virtual env and throw an error if we can't.
      try{
        const virutalenv = execSync(`source ${ansibleVirtualenvPath}`, { encoding: 'utf-8', shell: '/bin/bash' });
      }catch(err){
        throw new this.serverless.classes.Error(`Failed to enter the ansible virtualenv, please recheck the 'virtualenv' path.`);
      } 


      const decryptedOutput = execSync(`source ${ansibleVirtualenvPath} && ansible-vault decrypt ${vaultPath} --output=- --vault-password-file=${vaultPasswordFile}`, { encoding: 'utf-8', shell: '/bin/bash' });
      const lines = decryptedOutput.split('\n');

      // Store the vault vars to an object
      lines.forEach(line => {
        const [key, value] = line.split(':').map(part => part.trim()); 
      
        if (key && value) { 
          vaultVariables[key] = value;
        }
      });

      // Iterate the serverless.service.custom.ansibleVault.vars and replace all instances of {{ }} with the vault password.
      for (const [key, value] of Object.entries(variables)) {
        const matches = [...value.matchAll(vaultRegex)].map(match => match[1]);
        
        matches.forEach(vaultKey => {
            if(vaultVariables[vaultKey] != null) {
                variables[key] = variables[key].replace(`{{${vaultKey}}}`, vaultVariables[vaultKey])
            }else{
                throw new this.serverless.classes.Error(`Could not find ${vaultKey} in the ansible vault.`);
            }
        })

      }
    } catch (error) {
      this.serverless.cli.log('Error replacing Ansible Vault variables:', error);
      throw error;
    }
  }

}

module.exports = ServerlessAnsibleVaultPlugin;
