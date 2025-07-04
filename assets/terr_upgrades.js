export const upgrades = {
    'damage': {
        'costs': [0, 100, 300, 600, 1200, 2400, 4800, 8400, 12000, 15600, 19200, 22800],
        'display': 'Damage: +{}%',
        'effects': [1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.8, 4.2, 4.6, 5, 5.4],
        'name': 'Damage',
        'resource': 'ore',
    }, 

    'attack': {
        'costs': [0, 100, 300, 600, 1200, 2400, 4800, 8400, 12000, 15600, 19200, 22800],
        'display': 'Attacks per Second: +{}%',
        'effects': [1, 1.5, 2, 2.5, 3.2, 4, 5, 6, 7.2, 7.6, 8.4, 9.4],
        'name': 'Attack',
        'resource': 'crops',
    }, 

    'health': {
        'costs': [0, 100, 300, 600, 1200, 2400, 4800, 8400, 12000, 15600, 19200, 22800],
        'display': 'Health: +{}%',
        'effects': [1, 1.5, 2, 2.5, 3.2, 4, 5, 6.2, 7.4, 8.6, 9.8, 11],
        'name': 'Health',
        'resource': 'wood',
    }, 

    'defence': {
        'costs': [0, 100, 300, 600, 1200, 2400, 4800, 8400, 12000, 15600, 19200, 22800],
        'display': 'Defence: +{}%',
        'effects': [1, 4, 5.5, 6.25, 7, 7.5, 7.9, 8.2, 8.4, 8.6, 8.8, 9],
        'name': 'Defence',
        'resource': 'fish',
    }, 

    'minions': {
        'costs': [0, 200, 400, 800, 1600],
        'display': 'Minion Damage: +{}%',
        'effects': [1, 2.5, 3, 3.5, 4],
        'name': 'Stronger Minions',
        'resource': 'wood',
    }, 

    'multi': {
        'costs': [0, 4800],
        'display': 'Max Targets: {}',
        'effects': [1, 2],
        'name': 'Tower Multi-Attacks',
        'resource': 'fish',
    }, 

    'aura': {
        'costs': [0, 800, 1600, 3200],
        'display': 'Frequency: {}s',
        'effects': [0, 24, 18, 12],
        'name': 'Tower Aura',
        'resource': 'crops',
    }, 

    'volley': {
        'costs': [0, 200, 400, 800],
        'display': 'Frequency: {}s',
        'effects': [0, 20, 15, 10],
        'name': 'Tower Volley',
        'resource': 'ore',
    }, 

    'gatheringXp': {
        'costs': [0, 600, 1300, 2000, 2700, 3400, 5500, 10000, 20000],
        'display': 'Gathering XP: +{}%',
        'effects': [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2],
        'name': 'Gathering Experience',
        'resource': 'wood',
    }, 

    'mobXp': {
        'costs': [0, 600, 1200, 1800, 2400, 3000, 5000, 10000, 20000],
        'display': 'XP Bonus: +{}%',
        'effects': [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2],
        'name': 'Mob Experience',
        'resource': 'fish',
    }, 

    'mobDamage': {
        'costs': [0, 600, 1200, 1800, 2400, 3000, 5000, 10000, 20000],
        'display': 'Damage Bonus: +{}%',
        'effects': [1, 1.1, 1.2, 1.4, 1.6, 1.8, 2.2, 2.6, 3],
        'name': 'Mob Damage',
        'resource': 'crops',
    }, 

    'pvpDamage': {
        'costs': [0, 600, 1200, 1800, 2400, 3000, 5000, 10000, 20000],
        'display': 'Damage Bonus: +{}%',
        'effects': [1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.4, 1.65, 1.8],
        'name': 'PvP Damage',
        'resource': 'ore',
    }, 

    'xpSeeking': {
        'costs': [0, 100, 200, 400, 800, 1600, 3200, 6400, 9600, 12800],
        'display': 'Guild XP: +{}/h',
        'effects': [0, 36000, 66000, 120000, 228000, 456000, 900000, 1740000, 2580000, 3360000],
        'name': 'XP Seeking',
        'resource': 'emeralds',
    }, 

    'tomeSeeking': {
        'costs': [0, 400, 3200, 6400],
        'display': 'Drop Chance: {}%/h',
        'effects': [0, 0.15, 1.2, 2.4],
        'name': 'Tome Seeking',
        'resource': 'fish',
    }, 

    'emeraldSeeking': {
        'costs': [0, 200, 800, 1600, 3200, 6400],
        'display': 'Drop Chance: {}%/h',
        'effects': [0, 0.3, 3, 6, 12, 24],
        'name': 'Emerald Seeking',
        'resource': 'wood',
    }, 

    'resourceStorage': {
        'costs': [0, 400, 800, 2000, 5000, 16000, 48000],
        'display': 'Storage Bonus: +{}%',
        'effects': [1, 2, 4, 8, 15, 34, 80],
        'name': 'Larger Resource Storage',
        'resource': 'emeralds',
    }, 

    'emeraldStorage': {
        'costs': [0, 200, 400, 1000, 2500, 8000, 24000],
        'display': 'Storage Bonus: +{}%',
        'effects': [1, 2, 4, 8, 15, 34, 80],
        'name': 'Larger Emerald Storage',
        'resource': 'wood',
    }, 

    'efficientResources': {
        'costs': [0, 6000, 12000, 24000, 48000, 96000, 192000],
        'display': 'Gathering Bonus: +{}%',
        'effects': [1, 1.5, 2, 2.5, 3, 3.5, 4],
        'name': 'Efficient Resources',
        'resource': 'emeralds',
    }, 

    'efficientEmeralds': {
        'costs': [0, 2000, 8000, 32000],
        'display': 'Emerald Bonus: +{}%',
        'effects': [1, 1.35, 2, 4],
        'name': 'Efficient Emeralds',
        'resource': 'ore',
    }, 

    'resourceRate': {
        'costs': [0, 6000, 18000, 32000],
        'display': 'Gather Rate: {}s',
        'effects': [4, 3, 2, 1],
        'name': 'Resource Rate',
        'resource': 'emeralds',
    }, 
    
    'emeraldRate': {
        'costs': [0, 2000, 8000, 32000],
        'display': 'Gather Rate: {}s',
        'effects': [4, 3, 2, 1],
        'name': 'Emerald Rate',
        'resource': 'crops',
    }
};