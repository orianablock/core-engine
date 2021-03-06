import { Commands, Container } from "@arkecosystem/core-cli";
import { Networks } from "@arkecosystem/crypto";
import Joi from "joi";
import { existsSync } from "fs-extra";
import { join } from "path";

import { Git, NPM } from "../source-providers";

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "plugin:update";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Updates a package and any packages that it depends on.";

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("token", "The name of the token.", Joi.string().default("ark"))
            .setFlag("network", "The name of the network.", Joi.string().valid(...Object.keys(Networks)))
            .setArgument("package", "The name of the package.", Joi.string().required());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const pkg: string = this.getArgument("package");

        const paths = {
            data: this.app.getCorePath("data", "plugins"),
            temp: this.app.getCorePath("temp", "plugins"),
        };
        const directory: string = join(paths.data, pkg);

        if (!existsSync(directory)) {
            throw new Error(`The package [${pkg}] does not exist.`);
        }

        if (existsSync(`${directory}/.git`)) {
            return new Git(paths).update(pkg);
        }

        return new NPM(paths).update(pkg);
    }
}
