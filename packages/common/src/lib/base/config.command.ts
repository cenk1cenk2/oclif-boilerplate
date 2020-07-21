/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BaseCommand } from './base.command'
import { Locker } from '@extend/locker'
import { mergeObjects } from '@utils/custom.util'
import { checkExists, deleteFile, readFile } from '@utils/file-tools.util'
import { promptUser } from '@utils/prompt.util'

export abstract class ConfigBaseCommand extends BaseCommand {
  public choices: ('Show' | 'Add' | 'Remove' | 'Edit' | 'Init' | 'Import' | 'Delete')[]
  protected configLock: Locker = new Locker(this.id, 'local')
  protected abstract configName: string
  protected abstract configType: 'general' | 'local'

  public async run (): Promise<void> {
    await this.generateConfigurationMenu()
  }

  private async generateConfigurationMenu (): Promise<void> {
    if (!this.choices) {
      if (this.configType === 'general') {
        this.choices = [ 'Show', 'Add', 'Remove', 'Edit', 'Init', 'Import', 'Delete' ]
      } else if (this.configType === 'local') {
        this.choices = [ 'Show', 'Add', 'Remove', 'Edit', 'Import', 'Delete' ]
      } else {
        this.logger.critical('Config type to edit is wrong this should not have happened.')
        process.exit(126)
      }
    }

    // prompt user for the action
    const response: string = await promptUser({
      type: 'Select',
      message: 'Please select what to do with this configuration.',
      choices: this.choices
    })

    if (this[`${response.toLowerCase()}Config`]) {
      this[`${response.toLowerCase()}Config`]()
    } else {
      this.logger.critical('This should not have happened in config command! No valid function to execute.')
    }
  }

  // @ts-ignore
  private async addConfig (): Promise<void> {
    const { config } = await this.getConfig(this.configName)

    const desiredConfig = await this.configAdd(config)

    if (this.configType === 'general') {
      await this.resetConfig(this.configName, desiredConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: desiredConfig, merge: true } ])
    }
  }

  // @ts-ignore
  private async editConfig (): Promise<void> {
    const { config } = await this.getConfig(this.configName)

    if (Object.keys(config).length === 0) {
      this.logger.fail('No entries inside the config file.')
      return
    }
    const editedConfig = await this.configEdit(config)

    if (this.configType === 'general') {
      await this.resetConfig(this.configName, editedConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: editedConfig } ])
    }
  }

  // @ts-ignore
  private async removeConfig (): Promise<void> {
    // write configuration to file merge with existing one
    const { local, config } = await this.getConfig(this.configName)
    let desiredConfig = config

    // if does not have local config
    if (!local && this.configType === 'general') {
      this.logger.fail('No local configuration file found, please initiate it first.')
      return
    }

    const { keys, removeFunction } = await this.configRemove(config)

    // check entry count in the config file
    if (keys.length === 0) {
      this.logger.fail('No entries inside the config file.')
      return
    }

    // get prompts for which one to remote
    const userInput: string[] = await promptUser({
      type: 'MultiSelect',
      message: 'Please select configuration to delete. [space to select, a to select all]',
      choices: keys
    })

    // if nothing selected in the prompt
    if (userInput.length === 0) {
      this.logger.warn('Nothing selected to remove.')
      return
    }

    desiredConfig = await removeFunction(config, userInput)

    // write file
    if (this.configType === 'general') {
      await this.resetConfig(this.configName, desiredConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: desiredConfig } ])
    }
    this.logger.module(`Removed entries "${userInput.toString()}" from local config file.`)
  }

  // @ts-ignore
  private async showConfig (): Promise<void> {
    // get configuration file
    const { local, config } = await this.getConfig(this.configName)

    if (this.configType === 'general') {
      if (!local) {
        this.logger.warn('Use add to start with predefined local configuration or reset to start with empty local configuration that is editable through menu.')
      }
    }

    this.configShow(config)
  }

  // @ts-ignore
  private async importConfig (): Promise<void> {
    const userInput: { importPath?: string, merge?: boolean } = {}
    userInput.importPath = await promptUser({ type: 'Input', message: 'Enter the path you want to import from:' })

    if (!checkExists(userInput.importPath)) {
      this.logger.fail(`Import file can not be found at path "${userInput.importPath}".`)
      process.exit(21)
    }

    const { local, config } = await this.getConfig(this.configName)

    if (local && Object.keys(config)?.length > 0) {
      userInput.merge = await promptUser({
        type: 'Toggle',
        message: 'Do you want to merge with the current configuration file?',
        enabled: 'Merge',
        disabled: 'Import directly'
      })
    }

    const importFile = await readFile(userInput.importPath)

    let desiredConfig: any
    if (userInput.merge) {
      desiredConfig = mergeObjects(config, importFile)
    } else {
      desiredConfig = importFile
    }

    if (this.configType === 'general') {
      await this.resetConfig(this.configName, desiredConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: desiredConfig } ])
    }
    this.logger.module(`Imported configuration file from "${userInput.importPath}".`)
  }

  // @ts-ignore
  private async deleteConfig (): Promise<void> {
    let path: string

    if (this.configType === 'general') {
      ({ path } = await this.getConfig(this.configName))
    } else if (this.configType === 'local') {
      path = this.configLock.getLockPath()
    }

    if (!path) {
      this.logger.warn('No local configuration file found.')
      return
    }

    await deleteFile(path)
    this.logger.module(`Deleted local config file at "${path}".`)
  }

  // @ts-ignore
  private async initConfig (): Promise<void> {
    if (this.configType === 'general') {
      await this.resetConfig(this.configName)
    }

    let path: string

    if (this.configType === 'general') {
      ({ path } = await this.getConfig(this.configName))
    } else if (this.configType === 'local') {
      path = this.configLock.getLockPath()
    }

    this.logger.module(`Initiated local config file at "${path}".`)
  }

  abstract configAdd (configFile: any): Promise<any>

  abstract configEdit (configFile: any): Promise<any>

  abstract configShow (configFile: any): Promise<void>

  abstract configRemove (configFile: any): Promise<{ keys: string[], removeFunction: (configFile: any, userInput: string[]) => Promise<any> }>
}
