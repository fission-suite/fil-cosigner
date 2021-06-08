let
  sources = import ./nix/sources.nix;
  pkgs = import sources.nixpkgs { };
in pkgs.mkShell {
  name = "fil-cosigner";
  buildInputs = with pkgs; [
    nodejs-16_x
    (yarn.override { nodejs = nodejs-16_x; })

    # keep this line if you use bash
    pkgs.bashInteractive
  ];
}
