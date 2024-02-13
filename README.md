# serverless-ansible-vault

Enable the use of vault variables in your serverless configs!

## Installation

```
npm install --save serverless-ansible-vault
```

And activate it by adding the following configuration to your `serverless.yml` file:

```yaml
plugins:
  - serverless-ansible-vault
```

## Setup

### Requirements

To make use of the serverless-ansible-vault plugin you first have to reference 3 things in the custom section of your `serverless.yml` file.

```yaml
custom:
  ansibleVault:
    path: `path/to/the/ansible/vault` #(e.g. inventory/vault)
    passwordFile: `path/to/vault/password`
    virtualenv: `path/to/ansible/virtualenv`
```

After this you can now start to reference your vault variables like this:

```yaml
custom:
  ansibleVault:
    path: `path/to/the/ansible/vault` #(e.g. inventory/vault)
    passwordFile: `path/to/vault/password`
    virtualenv: `path/to/ansible/virtualenv`
    vars:
      api_key: `Bearer {{ vault_api_key }}`
      login: `{{ vault_username }}:{{ vault_password }}`
```

### Accessing Variables

Now you can access your variables anywhere in your `serverless.cfg` like so:

`${self:custom.ansibleVault.vars.YOUR_VARIABLE}`

## Author

Created by [Junaide Bhatti](https://github.com/junaide).

## License

MIT
