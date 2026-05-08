const ALL_AGENTS = [
    { name: "Astra",     image: "astra.webp",     role: "Controller"  },
    { name: "Breach",    image: "breach.webp",    role: "Initiator"   },
    { name: "Brimstone", image: "brimstone.webp", role: "Controller"  },
    { name: "Chamber",   image: "chamber.webp",   role: "Sentinel"    },
    { name: "Clove",     image: "clove.webp",     role: "Controller"  },
    { name: "Cypher",    image: "cypher.webp",    role: "Sentinel"    },
    { name: "Deadlock",  image: "deadlock.webp",  role: "Sentinel"    },
    { name: "Fade",      image: "fade.webp",      role: "Initiator"   },
    { name: "Gekko",     image: "gekko.webp",     role: "Initiator"   },
    { name: "Harbor",    image: "harbor.webp",    role: "Controller"  },
    { name: "Iso",       image: "iso.webp",       role: "Duelist"     },
    { name: "Jett",      image: "jett.webp",      role: "Duelist"     },
    { name: "KAY/O",     image: "kayo.webp",      role: "Initiator"   },
    { name: "Killjoy",   image: "killjoy.webp",   role: "Sentinel"    },
    { name: "Miks",      image: "miks.webp",      role: "Duelist"     },
    { name: "Neon",      image: "neon.webp",      role: "Duelist"     },
    { name: "Omen",      image: "omen.webp",      role: "Controller"  },
    { name: "Phoenix",   image: "phoenix.webp",   role: "Duelist"     },
    { name: "Raze",      image: "raze.webp",      role: "Duelist"     },
    { name: "Reyna",     image: "reyna.webp",     role: "Duelist"     },
    { name: "Sage",      image: "sage.webp",      role: "Sentinel"    },
    { name: "Skye",      image: "skye.webp",      role: "Initiator"   },
    { name: "Sova",      image: "sova.webp",      role: "Initiator"   },
    { name: "Tejo",      image: "tejo.webp",      role: "Initiator"   },
    { name: "Veto",      image: "veto.webp",      role: "Duelist"     },
    { name: "Viper",     image: "viper.webp",      role: "Controller"  },
    { name: "Vyse",      image: "vyse.webp",      role: "Sentinel"    },
    { name: "Waylay",    image: "waylay.webp",    role: "Duelist"     },
    { name: "Yoru",      image: "yoru.webp",      role: "Duelist"     }
];

const IMG_BASE = "../../images/valorant/agents/";

const ROLES = {
    Controller: ALL_AGENTS.filter(a => a.role === "Controller").map(a => a.name),
    Initiator:  ALL_AGENTS.filter(a => a.role === "Initiator").map(a => a.name),
    Sentinel:   ALL_AGENTS.filter(a => a.role === "Sentinel").map(a => a.name),
    Duelist:    ALL_AGENTS.filter(a => a.role === "Duelist").map(a => a.name),
};