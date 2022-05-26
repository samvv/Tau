
set termguicolors
set number

map ; :

autocmd VimLeave * call rpcnotify(tau_rpc_channel, "quit")

