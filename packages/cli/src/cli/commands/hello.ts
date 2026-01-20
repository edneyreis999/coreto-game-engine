/**
 * Hello Command - Example Oclif Command
 *
 * Demonstrates basic Oclif command structure with flags.
 * This serves as a template for future commands (run-ttk, export-context).
 *
 * @packageDocumentation
 */

import { Command, Flags } from '@oclif/core';

/**
 * Hello World command for testing Oclif setup.
 *
 * Usage:
 *   coreto-engine hello --name=World
 *   coreto-engine hello -n Claude
 */
export default class HelloCommand extends Command {
  /**
   * Command description shown in help output.
   */
  static description = 'Say hello to validate CLI setup';

  /**
   * Usage examples shown in help.
   */
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --name=Claude',
    '<%= config.bin %> <%= command.id %> -n "Coreto Team"',
  ];

  /**
   * Command-line flags definition.
   */
  static flags = {
    /**
     * Name to greet.
     */
    name: Flags.string({
      char: 'n',
      description: 'Name to greet',
      default: 'World',
    }),
  };

  /**
   * Command execution logic.
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(HelloCommand);

    this.log(`Hello ${flags.name}!`);
    this.log('');
    this.log('Coreto Game Engine - TTK Validation System');
    this.log('Version: 0.1.0');
    this.log('Status: CLI Setup Complete');
    this.log('');
    this.log('Oclif configuration successful!');
  }
}
