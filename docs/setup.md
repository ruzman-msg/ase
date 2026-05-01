
Setup
=====

User Setup
----------

### Installation

```
#   install ASE tool
npm install -g @rse/ase

#   install ASE plugin
ase setup install
```

### Update

```
#   update ASE tool and ASE plugin
ase setup update
```

### Uninstallation

```
#   uninstall ASE plugin
ase setup uninstall

#   uninstall ASE tool
npm uninstall -g @rse/ase
```

Contributor Setup
-----------------

### Initial Setup

```
#   clone repository
git clone https://github.com/rse/ase
cd ase

#   build tool
(cd tool && npm install && npm start build)

#   install tool call wrapper
mkdir -p $HOME/bin
(echo "#!/bin/sh"; echo "exec node `pwd`/tool/dst/ase.js \${1+\"$@\"}") >$HOME/bin/ase
chmod 755 $HOME/bin/ase

#   install plugin
ase setup install --dev
```

### Upgrade Setup (after foreign changes)

```
#   update repository (but keep local modifications)
git stash
git pull
git stash pop

#   re-build tool
(cd tool && npm install && npm start build)

#   re-install plugin
ase setup update --dev
```

### Update Setup (after own local changes)

```
#   re-build tool
(cd tool && npm install && npm start build)

#   re-install plugin
ase setup update --dev
```

