import { IConfig } from "../config";

export interface ITargetValidator {
  isValid(target: string): boolean;
}

export class SuffixTargetValidator implements ITargetValidator {
  private readonly config: IConfig;

  constructor(config: IConfig) {
    this.config = config;
  }

  isValid(target: string): boolean {
    try {
      const url = new URL(target);
      if (url.protocol !== "https:") return false;
      const suffix = this.config.allowedTargetHostSuffix;
      return url.hostname.endsWith(suffix);
    } catch {
      return false;
    }
  }
}
