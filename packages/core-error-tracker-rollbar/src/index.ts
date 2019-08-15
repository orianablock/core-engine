import { Support } from "@arkecosystem/core-kernel";
import Rollbar from "rollbar";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("error-tracker", new Rollbar(this.opts));
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
