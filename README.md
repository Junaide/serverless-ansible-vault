# serverless-ansible-vault

Enable the use of vault variables in your serverless configs!

## Installation

```
npm install serverless-ansible-vault
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
    path: `path/to/the/ansible/vault` #Required
    passwordFile: `path/to/vault/password` #Required
    virtualenv: `path/to/ansible/virtualenv` #Optional
```

After this you can now start to reference your vault variables in the provider environment section like this:

```yaml
provider:
    environment:
        USERNAME: "{{ vault_username }}"
        PASSWORD: "{{ vault_password }}"
        LOGIN: "{{ vault_username }}:{{ vault_password }}"
```

## Author

Created by [Junaide Bhatti](https://github.com/junaide).

## License

MIT
