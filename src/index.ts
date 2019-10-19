export function setup(config: IConfig) {
  console.log("Setup called with endpoint:", config.endpoint);
  return true;
}

export interface IConfig {
  endpoint: string;
}
