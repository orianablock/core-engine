import * as rpc from "@hapist/json-rpc";
import * as whitelist from "@hapist/whitelist";
import { Server as HapiServer } from "@hapi/hapi";
import * as hapiBasic from "@hapi/basic";

import { Container, Providers } from "@arkecosystem/core-kernel";
import { Validation } from "@arkecosystem/crypto";

import { Identifiers } from "../../ioc";
import { Authentication, Plugins } from "../../contracts";
import { ActionReader } from "../../action-reader";
import { rpcResponseHandler } from "./rpc-response-handler";

@Container.injectable()
export class PluginFactory implements Plugins.PluginFactory {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Identifiers.ActionReader)
    private readonly actionReader!: ActionReader;

    @Container.inject(Identifiers.BasicCredentialsValidator)
    private readonly basicCredentialsValidator!: Authentication.BasicCredentialsValidator;

    public preparePlugins(): Array<Plugins.RegisterPluginObject> {
        let pluginConfig = this.configuration.get("plugins")

        let plugins = [
            {
              plugin: rpcResponseHandler
            },
            {
                plugin: whitelist,
                options: {
                    // @ts-ignore
                    whitelist: pluginConfig.whitelist
                },
            },
            {
                plugin: rpc,
                options: {
                    methods: this.actionReader.discoverActions(),
                    processor: {
                        schema: {
                            properties: {
                                id: {
                                    type: ["number", "string"],
                                },
                                jsonrpc: {
                                    pattern: "2.0",
                                    type: "string",
                                },
                                method: {
                                    type: "string",
                                },
                                params: {
                                    type: "object",
                                },
                            },
                            required: ["jsonrpc", "method", "id"],
                            type: "object",
                        },
                        validate(data: object, schema: object) {
                            try {
                                const { error } = Validation.validator.validate(schema, data);
                                return { value: data, error: error ? error : null };
                            } catch (error) {
                                return { value: null, error: error.stack };
                            }
                        },
                    },
                },
            }
        ]

        // @ts-ignore
        if (pluginConfig.basicAuthentication.enabled) {
            plugins.push(this.prepareBasicAuthentication())
        }

        return plugins;
    }

    private prepareBasicAuthentication (): Plugins.RegisterPluginObject {
        return {
            plugin: {
                name: "basicAuthentication",
                version: "0.1.0",
                register: async (server: HapiServer) => {
                    await server.register(hapiBasic);

                    server.auth.strategy('simple', 'basic', { validate: async (...params) => {
                            // @ts-ignore
                            return this.validateBasicCredentials(...params)
                        } });
                    server.auth.default('simple');
                }
            }
        }
    }

    private async validateBasicCredentials(request, username, password, h) {
        let isValid = await this.basicCredentialsValidator.validate(username, password);

        return { isValid: isValid, credentials: { name: username } };
    }
}