import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Contracts, Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { SnapshotManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const manager = new SnapshotManager(this.opts);

        const databaseService = this.app.resolve<Contracts.Database.IDatabaseService>("database");

        this.app.bind("snapshots", manager.make(databaseService.connection as PostgresConnection));
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
