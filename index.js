'use strict';

const { execSync } = require('child_process');

class ServerlessAnsibleVaultPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.validateVaultConfig()

    this.hooks = {
      'before:package:initialize': this.replaceVaultVariables.bind(this),
    };
  }

  validateVaultConfig() {
    const ansibleVaultConfig = this.serverless.service.custom?.ansibleVault;
    if (!ansibleVaultConfig) {
      throw new this.serverless.classes.Error('No Ansible Vault configuration found in serverless.yml under custom.ansibleVault');
    }

    if (!ansibleVaultConfig.path) {
      throw new this.serverless.classes.Error('Ansible Vault configuration error: "path" is required');
    }

    if (!ansibleVaultConfig.passwordFile) {
      throw new this.serverless.classes.Error('Ansible Vault configuration error: "passwordFile" is required');
    }
  }


  replaceVaultVariables() {
    const vaultPath = this.serverless.service.custom.ansibleVault.path;
    const vaultPasswordFile = this.serverless.service.custom.ansibleVault.passwordFile;
    const ansibleVirtualenvPath = this.serverless.service.custom.ansibleVault.virtualenv;
    const variables = this.serverless.service.provider.environment

    const vaultVariables = {}
    const vaultRegex = /\{\{\s*(.+?)\s*\}\}/g;

    try {
    
      let decryptedOutput;
      try {
        // Redirect stderr to null to avoid printing errors from this command
        decryptedOutput = execSync(`ansible-vault decrypt ${vaultPath} --output=- --vault-password-file=${vaultPasswordFile}`, { encoding: 'utf-8', shell: '/bin/bash', stdio: ['ignore', 'pipe', 'ignore'] });
      } catch (err) {
        if (ansibleVirtualenvPath) {
          try {
            // Attempt the command again within the virtual environment, also suppressing stderr output
            decryptedOutput = execSync(`source ${ansibleVirtualenvPath} && ansible-vault decrypt ${vaultPath} --output=- --vault-password-file=${vaultPasswordFile}`, { encoding: 'utf-8', shell: '/bin/bash', stdio: ['ignore', 'pipe', 'ignore'] });
          } catch (innerErr) {
            throw new Error(`[serverless-ansible-vault] Failed to decrypt using Ansible vault with the virtualenv: ${innerErr.message}`);
          }
        } else {
          throw new Error(`[serverless-ansible-vault] Ansible environment not found. If you are using a virtualenv, add the 'virtualenv' parameter with a path to the /bin/activate to 'ansibleVault'.`);
        }
      }
      
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
        let newValue = value
        const matches = [...value.matchAll(vaultRegex)].map(match => match[1]);
        
        matches.forEach(vaultKey => {
            if(vaultVariables[vaultKey] != null) {
              newValue = newValue.replace(new RegExp(`\\{\\{\\s*${vaultKey}\\s*\\}\\}`, 'g'), vaultVariables[vaultKey]);
            }else{
                throw new this.serverless.classes.Error(`[serverless-ansible-vault] Could not find ${vaultKey} in the ansible vault.`);
            }
        });
        variables[key] = newValue;
      }
    } catch (error) {
      this.serverless.cli.log('[serverless-ansible-vault] Error replacing Ansible Vault variables:', error);
      throw error;
    }
  }

}

module.exports = ServerlessAnsibleVaultPlugin;
