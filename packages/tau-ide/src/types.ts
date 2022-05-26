
import { NeovimClient } from "neovim";

export interface TauAPI {
  client: NeovimClient;
}

export interface TauPluginExports {
  render(): React.ReactNode;
}

