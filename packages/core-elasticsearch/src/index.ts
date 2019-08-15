import { Support } from "@arkecosystem/core-kernel";
import { client } from "./client";
import { defaults } from "./defaults";
import { watchIndices } from "./indices";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (
            typeof this.opts.client !== "object" ||
            Array.isArray(this.opts.client) ||
            typeof this.opts.chunkSize !== "number"
        ) {
            throw new Error("Elasticsearch plugin config invalid");
        }

        await client.setUp(this.opts.client);

        await watchIndices(this.opts.chunkSize);

        this.app.bind("elasticsearch", await startServer(this.opts.server));
    }

    public async dispose(): Promise<void> {
        await this.app.resolve("elasticsearch").stop();
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
