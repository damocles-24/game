/*
============================================================
FIND MY HEART - MINI RPG ADVENTURE
Phaser 3
============================================================

GAME FLOW
1. Explore the west forest and find Heart #1.
2. Find the Old Key inside the rock maze.
3. Use the key to unlock the bridge gate.
4. Cross the river and activate a checkpoint.
5. Find Heart #2.
6. Avoid the moving Overthinking shadows.
7. Find Heart #3.
8. The final gate opens.
9. Find CJ in the secret garden.
10. Talk to CJ and complete the adventure.

Required external asset:
assets/girlfriend_final_phaser_clean_v2.png

The rest of the pixel art is generated directly in Phaser.
============================================================
*/


/* =========================================================
   PHASER CONFIG
========================================================= */

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;

const config = {
    type: Phaser.AUTO,

    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    parent: "game",

    backgroundColor: "#70b85d",

    pixelArt: true,

    physics: {
        default: "arcade",

        arcade: {
            debug: false
        }
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


const game = new Phaser.Game(config);


/* =========================================================
   MAIN GAME VARIABLES
========================================================= */

let sceneRef;

let player;

let cursors;
let keys;
let interactionKey;

let moveUp = false;
let moveDown = false;
let moveLeft = false;
let moveRight = false;

let currentDirection = "down";


/* =========================================================
   WORLD GROUPS
========================================================= */

let obstacles;
let hearts;
let shadows;
let signs;

let bridgeGate;
let bridgeGateLabel;

let finalGate;
let finalGateLabel;

let cj;


/* =========================================================
   QUEST / PLAYER STATE
========================================================= */

let heartsCollected = 0;

let hasOldKey = false;

let bridgeUnlocked = false;

let finalGateUnlocked = false;

let hp = 3;

let checkpointX = 180;
let checkpointY = 850;

let playerInvulnerable = false;

let gameFinished = false;


/* =========================================================
   UI
========================================================= */

let heartText;
let hpText;
let keyText;
let questText;
let messageText;

let areaText;

let interactPrompt;


/* =========================================================
   DIALOGUE
========================================================= */

let dialogueBox;
let dialogueName;
let dialogueText;
let dialogueHint;

let dialogueActive = false;
let dialogueIndex = 0;
let activeDialogue = [];
let activeSpeaker = "";

const cjDialogue = [
    "You actually made it all the way here...",
    "Three hearts, one key, a river, and even Overthinking couldn't stop you.",
    "Those hearts weren't really something you had to find.",
    "They were little pieces of the memories we've already made...",
    "the stupid things we laugh about...",
    "and the memories I still want to make with you.",
    "I know this is only a tiny game...",
    "but I wanted there to be one little world made only for you.",
    "And in every version of it...",
    "I'm still waiting for you at the end. ♥",
    "Happy Monthsary My Everything♥."
];


/* =========================================================
   INTERACTION STATE
========================================================= */

let nearbyInteractable = null;


/* =========================================================
   MOBILE INTERACT BUTTON
========================================================= */

let mobileInteractButton;


/* =========================================================
   PRELOAD
========================================================= */

let spriteLoadFailed = false;


function preload() {

    /*
        GIRLFRIEND SPRITE SHEET

        Layout:
        0  = down idle
        1  = up idle
        2  = left idle
        3  = right idle

        4  = down walk 1
        5  = up walk 1
        6  = left walk 1
        7  = right walk 1

        8  = down walk 2
        9  = up walk 2
        10 = left walk 2
        11 = right walk 2
    */

    this.load.spritesheet(
        "girlfriend",
        "assets/girlfriend_final_phaser_clean_v2.png",
        {
            frameWidth: 128,
            frameHeight: 160
        }
    );

    /*
        FALLBACK IF THE ASSET IS MISSING

        If assets/girlfriend_final_phaser_clean_v2.png hasn't
        been added yet (or the path is wrong), the loader
        fires 'loaderror' instead of throwing. We catch that
        and build a placeholder spritesheet at runtime so the
        game still runs tonight. Drop the real PNG into
        /assets and this fallback is simply never used again.
    */

    this.load.on(
        "loaderror",
        file => {

            if (file.key === "girlfriend") {

                spriteLoadFailed = true;

                console.warn(
                    "[Find My Heart] assets/girlfriend_final_phaser_clean_v2.png " +
                    "could not be loaded — using a placeholder sprite instead. " +
                    "Add the real file to /assets to replace it."
                );

            }

        }
    );

}


/* =========================================================
   CREATE
========================================================= */

function create() {

    sceneRef = this;


    /*
    ========================================================
    WORLD + CAMERA
    ========================================================
    */

    this.physics.world.setBounds(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );

    this.cameras.main.setBounds(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );

    this.cameras.main.setBackgroundColor("#70b85d");


    /*
    ========================================================
    GENERATED PIXEL TEXTURES
    ========================================================
    */

    createPixelTextures(this);


    /*
    ========================================================
    PLAYER SPRITE FALLBACK
    ========================================================

    If the real spritesheet failed to load (see preload),
    or somehow never registered, build a placeholder one now
    so the rest of the game — which expects a 12-frame
    "girlfriend" spritesheet — never has to know the
    difference.
    */

    if (
        spriteLoadFailed ||
        !this.textures.exists("girlfriend")
    ) {

        createPlaceholderGirlfriendTexture(this);

    }


    /*
    ========================================================
    PLAYER
    ========================================================

    The player is created BEFORE the world objects because
    some map objects (keys, gates, checkpoints) register
    physics interactions with the player while the map is
    being built.
    */

    player = this.physics.add.sprite(
        checkpointX,
        checkpointY,
        "girlfriend",
        0
    );

    player.setScale(0.45);

    player.setCollideWorldBounds(true);

    /*
        Keep collision mostly around the feet.
        This feels much better in a top-down RPG.
    */

    player.body.setSize(
        45,
        34
    );

    player.body.setOffset(
        41,
        120
    );

    player.setDepth(50);


    /*
    ========================================================
    PLAYER ANIMATIONS
    ========================================================
    */

    createPlayerAnimations(this);


    /*
    ========================================================
    MAP
    ========================================================
    */

    createWorld(this);


    /*
    ========================================================
    PHYSICS COLLISIONS
    ========================================================
    */

    this.physics.add.collider(
        player,
        obstacles
    );

    /*
        SOLID WORLD COLLISION:
        trees, rocks, invisible river walls, gate walls and
        permanent fences are all inside `obstacles`.
    */

    this.physics.add.overlap(
        player,
        hearts,
        collectHeart,
        null,
        this
    );

    /*
        Hearts, keys, checkpoints and hazards intentionally
        use overlap instead of collision because the player
        must be able to touch / collect them.
    */

    this.physics.add.overlap(
        player,
        shadows,
        hitShadow,
        null,
        this
    );


    /*
    ========================================================
    CAMERA
    ========================================================
    */

    this.cameras.main.startFollow(
        player,
        true,
        0.09,
        0.09
    );

    this.cameras.main.setZoom(1);


    /*
    ========================================================
    KEYBOARD
    ========================================================
    */

    cursors =
        this.input.keyboard.createCursorKeys();

    keys =
        this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

    interactionKey =
        this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.E
        );


    /*
    ========================================================
    UI
    ========================================================
    */

    createUI(this);


    /*
    ========================================================
    MOBILE BUTTONS
    ========================================================
    */

    setupMobileControls();

    createMobileInteractButton();


    /*
    ========================================================
    START MESSAGE
    ========================================================
    */

    showTemporaryMessage(
        "Quest started: Find the three missing hearts.",
        2600
    );

}


/* =========================================================
   UPDATE
========================================================= */

function update(time) {

    /*
    ========================================================
    DIALOGUE MODE
    ========================================================
    */

    if (dialogueActive) {

        player.body.setVelocity(0);

        player.anims.stop();


        if (
            Phaser.Input.Keyboard.JustDown(
                interactionKey
            )
        ) {

            nextDialogue();

        }


        return;
    }


    /*
    ========================================================
    GAME FINISHED
    ========================================================
    */

    if (gameFinished) {

        player.body.setVelocity(0);

        player.anims.stop();

        return;
    }


    /*
    ========================================================
    NORMAL MOVEMENT
    ========================================================
    */

    const speed = 175;

    player.body.setVelocity(0);

    let moving = false;


    /*
        Horizontal
    */

    if (
        cursors.left.isDown ||
        keys.left.isDown ||
        moveLeft
    ) {

        player.body.setVelocityX(-speed);

        currentDirection = "left";

        moving = true;

    }

    else if (
        cursors.right.isDown ||
        keys.right.isDown ||
        moveRight
    ) {

        player.body.setVelocityX(speed);

        currentDirection = "right";

        moving = true;

    }


    /*
        Vertical
    */

    if (
        cursors.up.isDown ||
        keys.up.isDown ||
        moveUp
    ) {

        player.body.setVelocityY(-speed);

        currentDirection = "up";

        moving = true;

    }

    else if (
        cursors.down.isDown ||
        keys.down.isDown ||
        moveDown
    ) {

        player.body.setVelocityY(speed);

        currentDirection = "down";

        moving = true;

    }


    /*
        Prevent diagonal speed boost.
    */

    if (moving) {

        player.body.velocity
            .normalize()
            .scale(speed);

    }


    /*
    ========================================================
    WALKING ANIMATION
    ========================================================
    */

    updatePlayerAnimation(moving);


    /*
    ========================================================
    Y-SORT DEPTH
    ========================================================

    Keep the player's draw order in sync with its Y position
    every frame, matching the trees/rocks/signs around it, so
    walking "in front of" or "behind" scenery looks correct
    instead of the player always rendering at a fixed layer.
    */

    player.setDepth(Math.floor(player.y));


    /*
    ========================================================
    MOVING SHADOW HAZARDS
    ========================================================
    */

    updateShadows(time);


    /*
    ========================================================
    INTERACTION CHECK
    ========================================================
    */

    checkNearbyInteraction();


    if (
        Phaser.Input.Keyboard.JustDown(
            interactionKey
        )
    ) {

        performInteraction();

    }


    /*
    ========================================================
    AREA LABEL
    ========================================================
    */

    updateAreaName();

}


/* =========================================================
   PLAYER ANIMATIONS
========================================================= */

function createPlayerAnimations(scene) {

    scene.anims.create({
        key: "walk-down",
        frames: [
            { key: "girlfriend", frame: 0 },
            { key: "girlfriend", frame: 4 },
            { key: "girlfriend", frame: 8 }
        ],
        frameRate: 6,
        repeat: -1
    });


    scene.anims.create({
        key: "walk-up",
        frames: [
            { key: "girlfriend", frame: 1 },
            { key: "girlfriend", frame: 5 },
            { key: "girlfriend", frame: 9 }
        ],
        frameRate: 6,
        repeat: -1
    });


    scene.anims.create({
        key: "walk-left",
        frames: [
            { key: "girlfriend", frame: 2 },
            { key: "girlfriend", frame: 6 },
            { key: "girlfriend", frame: 10 }
        ],
        frameRate: 6,
        repeat: -1
    });


    scene.anims.create({
        key: "walk-right",
        frames: [
            { key: "girlfriend", frame: 3 },
            { key: "girlfriend", frame: 7 },
            { key: "girlfriend", frame: 11 }
        ],
        frameRate: 6,
        repeat: -1
    });

}


function updatePlayerAnimation(moving) {

    if (moving) {

        player.anims.play(
            "walk-" + currentDirection,
            true
        );

        return;
    }


    player.anims.stop();


    if (currentDirection === "down") {

        player.setFrame(0);

    }

    else if (currentDirection === "up") {

        player.setFrame(1);

    }

    else if (currentDirection === "left") {

        player.setFrame(2);

    }

    else if (currentDirection === "right") {

        player.setFrame(3);

    }

}


/* =========================================================
   WORLD CREATION
========================================================= */

function createWorld(scene) {

    /*
    ========================================================
    BASE GRASS
    ========================================================
    */

    scene.add.rectangle(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        0x73b85e
    );


    /*
        Add subtle checker-like grass patches
        so the map feels less empty.
    */

    for (let y = 40; y < WORLD_HEIGHT; y += 80) {

        for (let x = 40; x < WORLD_WIDTH; x += 80) {

            const alternate =
                ((x / 80) + (y / 80)) % 2 === 0;

            scene.add.rectangle(
                x,
                y,
                80,
                80,
                alternate
                    ? 0x76ba60
                    : 0x70b258
            );

        }

    }


    /*
    ========================================================
    PATH NETWORK
    ========================================================
    */

    addPath(
        scene,
        180,
        850,
        1250,
        90
    );

    addPath(
        scene,
        350,
        530,
        90,
        730
    );

    addPath(
        scene,
        610,
        610,
        600,
        90
    );

    addPath(
        scene,
        1030,
        620,
        90,
        500
    );

    addPath(
        scene,
        1250,
        350,
        500,
        90
    );

    addPath(
        scene,
        1410,
        210,
        90,
        370
    );


    /*
    ========================================================
    RIVER
    ========================================================
    */

    createRiver(scene);


    /*
    ========================================================
    BRIDGE
    ========================================================
    */

    createBridge(scene);


    /*
    ========================================================
    PHYSICS GROUPS
    ========================================================
    */

    obstacles =
        scene.physics.add.staticGroup();

    hearts =
        scene.physics.add.staticGroup();

    shadows =
        scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

    signs = [];


    /*
    ========================================================
    WORLD BOUNDARY TREES
    ========================================================
    */

    createTreeBorder(scene);


    /*
    ========================================================
    WEST FOREST
    ========================================================
    */

    const westTrees = [
        [110, 760], [110, 680], [110, 600], [110, 520],
        [110, 440], [110, 360], [110, 280], [110, 200],
        [110, 120],

        [220, 730], [270, 690], [200, 600], [260, 550],
        [180, 470], [260, 430], [190, 350], [260, 300],
        [180, 210], [260, 160],

        [440, 770], [470, 700], [460, 630],
        [470, 460], [470, 390], [470, 320],
        [470, 250], [470, 180]
    ];

    westTrees.forEach(
        position => createSolidTree(
            scene,
            position[0],
            position[1]
        )
    );


    /*
    ========================================================
    HEART #1 FOREST POCKET
    ========================================================
    */

    createHeart(
        scene,
        335,
        235,
        1
    );


    /*
    ========================================================
    ROCK MAZE
    ========================================================
    */

    const rockMaze = [
        [530, 760], [590, 760], [650, 760],
        [530, 700],             [650, 700],
        [530, 640],             [650, 640],
        [530, 580], [590, 580], [650, 580],

        [570, 490], [630, 490], [690, 490],
        [690, 430], [690, 370],

        [530, 430], [530, 370], [590, 370]
    ];

    rockMaze.forEach(
        position => createSolidRock(
            scene,
            position[0],
            position[1]
        )
    );


    /*
    ========================================================
    OLD KEY
    ========================================================
    */

    createOldKey(
        scene,
        610,
        430
    );


    /*
    ========================================================
    BRIDGE LOCKED GATE
    ========================================================
    */

    bridgeGate =
        scene.add.rectangle(
            800,
            610,
            26,
            92,
            0x49354f
        );

    bridgeGate.setStrokeStyle(
        4,
        0xf3c969
    );

    scene.physics.add.existing(
        bridgeGate,
        true
    );

    scene.physics.add.collider(
        player,
        bridgeGate
    );

    bridgeGateLabel =
        scene.add.text(
            800,
            550,
            "🔑",
            {
                fontSize: "22px"
            }
        );

    bridgeGateLabel
        .setOrigin(0.5)
        .setDepth(40);


    /*
    ========================================================
    BRIDGE GATE WALLS / POSTS

    These solid posts connect the gate to the river collision.
    The player cannot squeeze around the top or bottom edge
    of the locked gate.
    ========================================================
    */

    createSolidWall(
        scene,
        800,
        540,
        38,
        50,
        0x55485d
    );

    createSolidWall(
        scene,
        800,
        680,
        38,
        80,
        0x55485d
    );


    /*
    ========================================================
    HEART #2 — JUST PAST THE BRIDGE GATE
    ========================================================
    */

    createHeart(
        scene,
        860,
        590,
        2
    );


    /*
    ========================================================
    CHECKPOINTS

    Three checkpoints, one before each difficult section:
    before the bridge, before the maze, and before the
    final stretch to the gate. Each one is independent, so
    reaching a later checkpoint doesn't require re-touching
    earlier ones, and dying never sends the player further
    back than the last section they were working on.
    ========================================================
    */

    createCheckpoint(
        scene,
        700,
        850,
        "before the bridge"
    );

  

            

    /*
    ========================================================
    MEADOW DECORATION

    A handful of rocks purely in the open meadow, kept clear
    of the maze grid so they never narrow a corridor.
    ========================================================
    */

    const meadowRocks = [
        [820, 760], [800, 460],
        [885, 470], [930, 470], [700, 500]
    ];

    meadowRocks.forEach(
        position => createSolidRock(
            scene,
            position[0],
            position[1]
        )
    );

    /*
        Invisible collision behind the two rocks before the maze.
        The rocks stay as the visible blocker, while this closes the
        tiny side gaps so the player cannot squeeze around them and
        shortcut toward the Secret Garden.
    */
    createSolidWall(
        scene,
        917,
        470,
        100,
        46,
        0x000000,
        0
    );


    /*
    ========================================================
    HEART #3 — INSIDE THE OVERTHINKING MAZE
    ========================================================

    Placed at the center of an open maze cell (grid origin
    960,350 / cell size 100 — see createAdventureObstacles),
    clear of every wall segment and outside all four shadow
    patrol paths, so it's reachable but still makes the
    player actually navigate the maze to get it.
    */

    createHeart(
        scene,
        1210,
        500,
        3
    );


    /*
    ========================================================
    FINAL GATE
    ========================================================
    */

    finalGate =
        scene.add.rectangle(
            1410,
            350,
            92,
            26,
            0x3b243e
        );

    finalGate.setStrokeStyle(
        4,
        0xff6f9f
    );

    scene.physics.add.existing(
        finalGate,
        true
    );

    scene.physics.add.collider(
        player,
        finalGate
    );

    finalGateLabel =
        scene.add.text(
            1410,
            320,
            "🔒",
            {
                fontSize: "24px"
            }
        );

    finalGateLabel
        .setOrigin(0.5)
        .setDepth(40);


    /*
    ========================================================
    FINAL GATE WALLS

    The final gate now sits inside a real solid fence.
    The only way into the Secret Garden is THROUGH the gate.
    The player cannot walk around it through the grass.
    ========================================================
    */

    createSolidWall(
        scene,
        1285,
        350,
        158,
        28,
        0x315f36
    );

    createSolidWall(
        scene,
        1535,
        350,
        158,
        28,
        0x315f36
    );


    /*
    ========================================================
    HARDER RPG OBSTACLE PASS
    ========================================================

    Extra solid walls, rock corridors and forest barriers.
    These use the existing obstacle system, so they have real
    collision without changing the quest / HUD / sprite logic.
    */

    createAdventureObstacles(scene);


    /*
    ========================================================
    SECRET GARDEN
    ========================================================
    */

    createSecretGarden(scene);


    /*
    ========================================================
    CJ
    ========================================================
    */

    cj =
        scene.physics.add.staticSprite(
            1410,
            135,
            "cj"
        );

    cj.setScale(2.2);

    cj.setDepth(45);

    cj.setVisible(false);

    cj.body.enable = false;

    cj.interactionType = "cj";

    /*
        CJ is a solid NPC. Once he becomes visible / enabled,
        the player can stand in front of him but cannot walk
        straight through him.
    */

    scene.physics.add.collider(
        player,
        cj
    );


    /*
    ========================================================
    SIGNPOSTS
    ========================================================
    */

    createSign(
        scene,
        250,
        830,
        "start",
        "Three hearts are scattered across this world.\nMaybe someone is waiting at the end."
    );

    createSign(
        scene,
        520,
        530,
        "maze",
        "ROCK MAZE\nSomething useful is hidden inside."
    );

    createSign(
        scene,
        720,
        700,
        "bridge",
        "OLD BRIDGE\nA locked gate blocks the crossing."
    );

    createSign(
        scene,
        915,
        640,
        "danger",
        "OVERTHINKING MAZE\nWatch the shadows' rhythm, then move."
    );

}


/* =========================================================
   PATH / MAP DECORATION
========================================================= */

function addPath(
    scene,
    x,
    y,
    width,
    height
) {

    scene.add.rectangle(
        x,
        y,
        width,
        height,
        0xd8b77b
    );

    scene.add.rectangle(
        x,
        y,
        Math.max(6, width - 12),
        Math.max(6, height - 12),
        0xdcbc82
    );

}


/* =========================================================
   RIVER
========================================================= */

function createRiver(scene) {

    /*
        River visuals.
    */

    scene.add.rectangle(
        800,
        500,
        150,
        1000,
        0x5ca8d8
    );

    scene.add.rectangle(
        770,
        500,
        8,
        1000,
        0x9dd7ef
    );

    scene.add.rectangle(
        830,
        500,
        8,
        1000,
        0x4c91c3
    );


    /*
        Water collision blocks everything except
        the bridge opening around y = 610.
    */

    createInvisibleWall(
        scene,
        800,
        255,
        150,
        510
    );

    createInvisibleWall(
        scene,
        800,
        820,
        150,
        360
    );

}


/* =========================================================
   BRIDGE
========================================================= */

function createBridge(scene) {

    scene.add.rectangle(
        800,
        610,
        180,
        100,
        0xb88754
    );

    for (let y = 570; y <= 650; y += 16) {

        scene.add.rectangle(
            800,
            y,
            170,
            10,
            0xc99862
        );

    }

}


/* =========================================================
   HEDGE WALL
========================================================= */

function createHedgeWall(
    scene,
    x,
    y,
    width,
    height
) {

    /*
        Base collision wall.
    */

    const wall =
        createSolidWall(
            scene,
            x,
            y,
            width,
            height,
            0x315f36
        );


    /*
        Softer inner highlight so the maze looks like a hedge
        instead of a plain rectangle.
    */

    const horizontal =
        width >= height;

    const highlight =
        scene.add.rectangle(
            x,
            y - (horizontal ? 3 : 0),
            Math.max(
                6,
                width - (horizontal ? 8 : 10)
            ),
            Math.max(
                6,
                height - (horizontal ? 10 : 8)
            ),
            0x3f7d43,
            0.85
        );

    highlight.setDepth(
        Math.floor(y) + 0.1
    );


    /*
        Tiny leaf blocks add pixel texture without clutter.
    */

    const step = 28;

    if (horizontal) {

        for (
            let px = x - width / 2 + 16;
            px < x + width / 2 - 10;
            px += step
        ) {

            scene.add.rectangle(
                px,
                y - 6,
                9,
                5,
                0x4c914f,
                0.9
            )
            .setDepth(
                Math.floor(y) + 0.2
            );

        }

    }

    else {

        for (
            let py = y - height / 2 + 16;
            py < y + height / 2 - 10;
            py += step
        ) {

            scene.add.rectangle(
                x - 5,
                py,
                5,
                9,
                0x4c914f,
                0.9
            )
            .setDepth(
                Math.floor(y) + 0.2
            );

        }

    }


    return wall;

}


/* =========================================================
   SOLID WALL / FENCE

   Used for gate frames, fences and permanent walls.
   These are real Arcade Physics static collision objects.
========================================================= */

function createSolidWall(
    scene,
    x,
    y,
    width,
    height,
    color = 0x3f3346,
    alpha = 1
) {

    const wall =
        scene.add.rectangle(
            x,
            y,
            width,
            height,
            color,
            alpha
        );

    wall.setStrokeStyle(
        2,
        0x1d1821
    );

    scene.physics.add.existing(
        wall,
        true
    );

    /*
        Add to the master obstacle group so the existing
        player-vs-obstacles collider handles this wall too.
    */

    obstacles.add(wall);

    wall.setDepth(
        Math.floor(y)
    );

    return wall;

}


/* =========================================================
   INVISIBLE WALL
========================================================= */

function createInvisibleWall(
    scene,
    x,
    y,
    width,
    height
) {

    /*
        obstacles may not exist yet when river is initially
        drawn, so defer these walls into a temporary list.
    */

    if (!scene._pendingWalls) {

        scene._pendingWalls = [];

    }

    scene._pendingWalls.push({
        x,
        y,
        width,
        height
    });

}


/* =========================================================
   TREE BORDER
========================================================= */

function createTreeBorder(scene) {

    /*
    ========================================================
    HARD WORLD WALLS

    Decorative trees have smaller trunk hitboxes on purpose,
    so we also create invisible perimeter walls. This means
    there are no gaps between border trees that the player
    can exploit.
    ========================================================
    */

    createSolidWall(
        scene,
        WORLD_WIDTH / 2,
        8,
        WORLD_WIDTH,
        16,
        0x000000,
        0
    );

    createSolidWall(
        scene,
        WORLD_WIDTH / 2,
        WORLD_HEIGHT - 8,
        WORLD_WIDTH,
        16,
        0x000000,
        0
    );

    createSolidWall(
        scene,
        8,
        WORLD_HEIGHT / 2,
        16,
        WORLD_HEIGHT,
        0x000000,
        0
    );

    createSolidWall(
        scene,
        WORLD_WIDTH - 8,
        WORLD_HEIGHT / 2,
        16,
        WORLD_HEIGHT,
        0x000000,
        0
    );


    /*
        First create pending river collision walls,
        now that obstacles exists.
    */

    if (scene._pendingWalls) {

        scene._pendingWalls.forEach(wall => {

            const rect =
                scene.add.rectangle(
                    wall.x,
                    wall.y,
                    wall.width,
                    wall.height,
                    0x000000,
                    0
                );

            scene.physics.add.existing(
                rect,
                true
            );

            obstacles.add(rect);

        });

    }


    /*
        Outer border.
    */

    for (let x = 40; x <= WORLD_WIDTH - 40; x += 70) {

        createSolidTree(
            scene,
            x,
            40
        );

        createSolidTree(
            scene,
            x,
            WORLD_HEIGHT - 40
        );

    }


    for (let y = 110; y <= WORLD_HEIGHT - 110; y += 70) {

        createSolidTree(
            scene,
            40,
            y
        );

        createSolidTree(
            scene,
            WORLD_WIDTH - 40,
            y
        );

    }

}


/* =========================================================
   SOLID TREE
========================================================= */

function createSolidTree(
    scene,
    x,
    y
) {

    const tree =
        obstacles.create(
            x,
            y,
            "tree"
        );

    tree.setScale(2.2);

    tree.refreshBody();

    /*
        Narrow the collision to the trunk/lower part.
    */

    tree.body.setSize(
        15,
        13
    );

    tree.body.setOffset(
        5,
        11
    );

    tree.setDepth(
        Math.floor(y)
    );

}


/* =========================================================
   SOLID ROCK
========================================================= */

function createSolidRock(
    scene,
    x,
    y
) {

    const rock =
        obstacles.create(
            x,
            y,
            "rock"
        );

    rock.setScale(2);

    rock.refreshBody();

    rock.body.setSize(
        18,
        12
    );

    rock.body.setOffset(
        3,
        9
    );

    rock.setDepth(
        Math.floor(y)
    );

}


/* =========================================================
   HEARTS
========================================================= */

function createHeart(
    scene,
    x,
    y,
    heartNumber
) {

    const heart =
        hearts.create(
            x,
            y,
            "heart"
        );

    heart.setScale(2.3);

    heart.refreshBody();

    heart.heartNumber = heartNumber;

    /*
        Depth by Y position, like every other ground object
        (signs, trees, rocks), so nearby scenery correctly
        draws in front of or behind the heart instead of
        always covering it. A flat depth of 30 used to bury
        hearts under anything below the top of the map.
    */

    heart.setDepth(Math.floor(y) + 1);


    /*
        Soft pulse. We animate alpha instead of position so
        the static physics body stays perfectly aligned.
    */

    scene.tweens.add({
        targets: heart,
        alpha: 0.65,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
    });

}


/* =========================================================
   COLLECT HEART
========================================================= */

function collectHeart(
    playerObject,
    heart
) {

    /*
        Disable immediately to avoid duplicate overlap calls.
    */

    heart.disableBody(
        true,
        true
    );

    heartsCollected++;


    heartText.setText(
        "♥ Hearts: " +
        heartsCollected +
        " / 3"
    );


    if (heart.heartNumber === 1) {

        showTemporaryMessage(
            "Memory Fragment #1: \"For how our story began.\"",
            3200
        );

        updateQuest(
            "Find the Old Key inside the rock maze."
        );

    }


    else if (heart.heartNumber === 2) {

        showTemporaryMessage(
            "Memory Fragment #2: \"For every stupid thing we laugh about.\"",
            3400
        );

        updateQuest(
            "Head north. Avoid Overthinking and find the final heart."
        );

    }


    else if (heart.heartNumber === 3) {

        showTemporaryMessage(
            "Memory Fragment #3: \"For all the memories we haven't made yet.\"",
            3600
        );

    }


    /*
        All three hearts unlock the final gate.
    */

    if (
        heartsCollected === 3 &&
        !finalGateUnlocked
    ) {

        unlockFinalGate();

    }

}


/* =========================================================
   OLD KEY
========================================================= */

function createOldKey(
    scene,
    x,
    y
) {

    const key =
        scene.physics.add.staticSprite(
            x,
            y,
            "key"
        );

    key.setScale(2.2);

    key.refreshBody();

    /* Y-sorted, for the same reason as the heart depth above. */

    key.setDepth(Math.floor(y) + 1);

    key.interactionType = "key";

    key.displayName = "Old Key";


    scene.physics.add.overlap(
        player,
        key,
        () => {

            if (hasOldKey) {

                return;

            }

            hasOldKey = true;

            key.disableBody(
                true,
                true
            );

            keyText.setText(
                "🔑 Old Key"
            );

            showTemporaryMessage(
                "You found the Old Key! The bridge gate can now be opened.",
                3200
            );

            updateQuest(
                "Take the Old Key to the bridge gate."
            );

        },
        null,
        scene
    );

}


/* =========================================================
   CHECKPOINT
========================================================= */

function createCheckpoint(
    scene,
    x,
    y,
    label
) {

    const checkpoint =
        scene.physics.add.staticSprite(
            x,
            y,
            "checkpoint"
        );

    checkpoint.setScale(2);

    checkpoint.refreshBody();

    /*
        Kept low relative to nearby scenery — a checkpoint is
        a flat ground marker, so it should sit under trees,
        rocks, and signs at similar Y rather than compete with
        them, but still above bare grass.
    */

    checkpoint.setDepth(Math.floor(y) - 10);

    /*
        Each checkpoint tracks its OWN activation state.
        Earlier versions shared a single global flag, which
        meant only the very first checkpoint touched could
        ever fire. Respawn point always becomes the most
        recently activated checkpoint.
    */

    checkpoint.activated = false;

    scene.physics.add.overlap(
        player,
        checkpoint,
        () => {

            checkpointX = x;
            checkpointY = y + 55;

            if (checkpoint.activated) {

                return;

            }

            checkpoint.activated = true;

            checkpoint.setTint(
                0xff8fb4
            );

            showTemporaryMessage(
                "Checkpoint activated" +
                (label ? " — " + label : "") +
                " ♥",
                2200
            );

        },
        null,
        scene
    );

}


/* =========================================================
   SHADOW HAZARDS
========================================================= */

function createShadow(
    scene,
    x,
    y,
    movementType,
    distance
) {

    const shadow =
        shadows.create(
            x,
            y,
            "shadow"
        );

    shadow.setScale(2);

    shadow.body.setAllowGravity(false);

    shadow.setImmovable(true);

    shadow.startX = x;
    shadow.startY = y;

    shadow.movementType = movementType;

    shadow.distance = distance;

    shadow.phase =
        Phaser.Math.FloatBetween(
            0,
            Math.PI * 2
        );

    shadow.setDepth(35);

}


function updateShadows(time) {

    shadows.children.iterate(shadow => {

        if (!shadow) {

            return;

        }

        const wave =
            Math.sin(
                (time * 0.00105) +
                shadow.phase
            );

        if (
            shadow.movementType ===
            "horizontal"
        ) {

            shadow.x =
                shadow.startX +
                wave *
                shadow.distance;

        }

        else {

            shadow.y =
                shadow.startY +
                wave *
                shadow.distance;

        }

        shadow.body.updateFromGameObject();

        /*
            Shadows drift up/down or left/right, so their
            depth needs to be re-sorted every frame too,
            same as the player.
        */

        shadow.setDepth(Math.floor(shadow.y));

    });

}


/* =========================================================
   HIT BY SHADOW
========================================================= */

function hitShadow() {

    if (
        playerInvulnerable ||
        dialogueActive ||
        gameFinished
    ) {

        return;

    }

    playerInvulnerable = true;

    hp--;

    hpText.setText(
        "HP: " +
        "♥".repeat(
            Math.max(
                0,
                hp
            )
        )
    );


    /*
        Flash player.
    */

    sceneRef.tweens.add({
        targets: player,
        alpha: 0.2,
        duration: 100,
        yoyo: true,
        repeat: 5
    });


    if (hp <= 0) {

        showTemporaryMessage(
            "Overthinking got you. Returning to the checkpoint...",
            1800
        );


        sceneRef.time.delayedCall(
            700,
            () => {

                hp = 3;

                hpText.setText(
                    "HP: ♥♥♥"
                );

                player.setPosition(
                    checkpointX,
                    checkpointY
                );

                player.setAlpha(1);

            }
        );

    }

    else {

        showTemporaryMessage(
            "Ouch! Avoid the Overthinking shadows.",
            1700
        );

    }


    sceneRef.time.delayedCall(
        1800,
        () => {

            playerInvulnerable = false;

            player.setAlpha(1);

        }
    );

}


/* =========================================================
   FINAL GATE
========================================================= */

function unlockFinalGate() {

    finalGateUnlocked = true;


    if (finalGate) {

        finalGate.destroy();

        finalGate = null;

    }


    if (finalGateLabel) {

        finalGateLabel.destroy();

        finalGateLabel = null;

    }


    if (cj) {

        cj.setVisible(true);

        cj.body.enable = true;

    }


    updateQuest(
        "The secret garden is open. Find CJ."
    );


    showTemporaryMessage(
        "All three hearts are complete. The final gate opened! ♥",
        3600
    );


    /*
        Camera flash for the unlock moment.
    */

    sceneRef.cameras.main.flash(
        350,
        255,
        130,
        170
    );

}


/* =========================================================
   HARDER RPG OBSTACLES / WALLS
========================================================= */

function createAdventureObstacles(scene) {

    /*
    ========================================================
    PAC-MAN STYLE RPG MAZE
    ========================================================

    Reference:
    - clean 90-degree corridors
    - connected wall sections
    - wider paths
    - fewer enemies
    - predictable enemy patrols
    - always winnable

    Main route:
    BRIDGE
      -> HEART #2
      -> lower maze
      -> middle maze
      -> upper maze
      -> HEART #3
      -> FINAL GATE
    ========================================================
    */


    /*
    ========================================================
    WEST / KEY AREA
    ========================================================

    Keep the west side simple so the player reaches the
    bridge without fighting through another maze.
    */

    const keyAreaRocks = [
        [530, 760],
        [650, 760],
        [530, 650],
        [650, 650],
        [575, 540],
        [680, 480],
        [535, 420]
    ];

    keyAreaRocks.forEach(position => {

        createSolidRock(
            scene,
            position[0],
            position[1]
        );

    });


    /*
    ========================================================
    OVERTHINKING MAZE — GRID-DESIGNED
    ========================================================

    Built from a 5x4 cell grid (100px cells) using a
    recursive-backtracker layout, then verified with a
    breadth-first search from the entrance to the exit
    before ever becoming Phaser objects. A few extra
    connections were opened afterward for loops/shortcuts,
    which can only add reachability, never remove it — so
    the maze stays provably solvable.

    Grid origin: (960, 350)  |  cell size: 100  |  wall
    thickness: 24.

    Entrance: (960, 600)  — opens onto the meadow, right
              after the "before the maze" checkpoint.
    Exit:     (1410, 350) — this is exactly where the
              final gate already stands, so clearing the
              maze leads straight to it.
    */

    const mazeWalls = [
        [960, 400, 24, 124],
        [960, 500, 24, 124],
        [960, 700, 24, 124],
        [1060, 600, 24, 124],
        [1260, 400, 24, 124],
        [1260, 700, 24, 124],
        [1360, 500, 24, 124],
        [1360, 600, 24, 124],
        [1460, 400, 24, 124],
        [1460, 500, 24, 124],
        [1460, 600, 24, 124],
        [1460, 700, 24, 124],
        [1010, 350, 124, 24],
        [1110, 350, 124, 24],
        [1210, 350, 124, 24],
        [1310, 350, 124, 24],
        [1010, 450, 124, 24],
        [1110, 550, 124, 24],
        [1010, 650, 124, 24],
        [1210, 650, 124, 24],
        [1010, 750, 124, 24],
        [1110, 750, 124, 24],
        [1210, 750, 124, 24],
        [1310, 750, 124, 24],
        [1410, 750, 124, 24]
    ];


    mazeWalls.forEach(wall => {

        createHedgeWall(
            scene,
            wall[0],
            wall[1],
            wall[2],
            wall[3]
        );

    });


    /*
    ========================================================
    PAC-MAN STYLE ENEMIES
    ========================================================

    Exactly FOUR, each guarding a single straight corridor
    of the grid (never a junction), so the player can watch
    from a safe cell, learn the timing, and cross.
    */

    createShadow(
        scene,
        1160,
        400,
        "horizontal",
        45
    );

    createShadow(
        scene,
        1060,
        500,
        "horizontal",
        45
    );

    createShadow(
        scene,
        1160,
        600,
        "horizontal",
        45
    );

    createShadow(
        scene,
        1310,
        450,
        "vertical",
        45
    );


    /*
    ========================================================
    CLEAN FINAL APPROACH / SECRET GARDEN
    ========================================================

    Removed the extra isolated hedge walls here. They were
    visually cluttering the open area without improving the
    maze. The main Overthinking maze walls above remain.
    */

}


/* =========================================================
   SECRET GARDEN
========================================================= */

function createSecretGarden(scene) {

    /*
        Darker grass patch.
    */

    scene.add.rectangle(
        1410,
        165,
        300,
        230,
        0x6dab62
    );


    /*
        Flower border.
    */

    const flowers = [
        [1300, 90], [1350, 80], [1400, 85],
        [1450, 80], [1500, 90],

        [1290, 150], [1520, 150],

        [1300, 220], [1350, 235], [1400, 225],
        [1450, 235], [1500, 220]
    ];


    flowers.forEach(position => {

        const flower =
            scene.add.image(
                position[0],
                position[1],
                "flower"
            );

        flower.setScale(2);

        flower.setDepth(12);

    });

}


/* =========================================================
   SIGNPOSTS
========================================================= */

function createSign(
    scene,
    x,
    y,
    id,
    message
) {

    const sign =
        scene.physics.add.staticSprite(
            x,
            y,
            "sign"
        );

    sign.setScale(2);

    sign.refreshBody();

    sign.setDepth(
        Math.floor(y)
    );

    sign.signId = id;

    sign.message = message;

    sign.interactionType = "sign";

    /*
        A sign is a real world object, so the player cannot
        simply walk through it.
    */

    scene.physics.add.collider(
        player,
        sign
    );

    signs.push(sign);

}


/* =========================================================
   INTERACTION DETECTION
========================================================= */

function checkNearbyInteraction() {

    nearbyInteractable = null;


    /*
    ========================================================
    BRIDGE GATE
    ========================================================
    */

    if (
        bridgeGate &&
        Phaser.Math.Distance.Between(
            player.x,
            player.y,
            bridgeGate.x,
            bridgeGate.y
        ) < 95
    ) {

        nearbyInteractable = {
            type: "bridgeGate",
            object: bridgeGate
        };

    }


    /*
    ========================================================
    SIGNS
    ========================================================
    */

    signs.forEach(sign => {

        if (
            Phaser.Math.Distance.Between(
                player.x,
                player.y,
                sign.x,
                sign.y
            ) < 72
        ) {

            nearbyInteractable = {
                type: "sign",
                object: sign
            };

        }

    });


    /*
    ========================================================
    CJ
    ========================================================
    */

    if (
        cj &&
        cj.visible &&
        Phaser.Math.Distance.Between(
            player.x,
            player.y,
            cj.x,
            cj.y
        ) < 85
    ) {

        nearbyInteractable = {
            type: "cj",
            object: cj
        };

    }


    /*
    ========================================================
    PROMPT
    ========================================================
    */

    if (nearbyInteractable) {

        interactPrompt
            .setText(
                "E  INTERACT"
            )
            .setVisible(true);

        if (mobileInteractButton) {

            mobileInteractButton.style.display =
                "block";

        }

    }

    else {

        interactPrompt.setVisible(false);

        if (mobileInteractButton) {

            mobileInteractButton.style.display =
                "none";

        }

    }

}


/* =========================================================
   PERFORM INTERACTION
========================================================= */

function performInteraction() {

    if (
        !nearbyInteractable ||
        dialogueActive ||
        gameFinished
    ) {

        return;

    }


    /*
    ========================================================
    BRIDGE GATE
    ========================================================
    */

    if (
        nearbyInteractable.type ===
        "bridgeGate"
    ) {

        if (!hasOldKey) {

            startDialogue(
                "Locked Gate",
                [
                    "The bridge gate is locked.",
                    "There must be a key somewhere in the rock maze."
                ]
            );

            return;

        }


        if (!bridgeUnlocked) {

            bridgeUnlocked = true;

            bridgeGate.destroy();

            bridgeGate = null;


            if (bridgeGateLabel) {

                bridgeGateLabel.destroy();

                bridgeGateLabel = null;

            }


            startDialogue(
                "System",
                [
                    "You used the Old Key.",
                    "The bridge is open."
                ]
            );


            updateQuest(
                "Cross the bridge and search the eastern meadow."
            );

        }

        return;

    }


    /*
    ========================================================
    SIGN
    ========================================================
    */

    if (
        nearbyInteractable.type ===
        "sign"
    ) {

        startDialogue(
            "Sign",
            nearbyInteractable
                .object
                .message
                .split("\n")
        );

        return;

    }


    /*
    ========================================================
    CJ
    ========================================================
    */

    if (
        nearbyInteractable.type ===
        "cj"
    ) {

        startDialogue(
            "CJ",
            cjDialogue,
            finishGame
        );

    }

}


/* =========================================================
   DIALOGUE SYSTEM
========================================================= */

let dialogueFinishedCallback = null;


function startDialogue(
    speaker,
    lines,
    onFinished = null
) {

    if (!Array.isArray(lines)) {

        lines = [lines];

    }

    dialogueActive = true;

    activeSpeaker = speaker;

    activeDialogue = lines;

    dialogueIndex = 0;

    dialogueFinishedCallback =
        onFinished;


    messageText.setVisible(false);

    interactPrompt.setVisible(false);


    dialogueBox.setVisible(true);

    dialogueName
        .setText(
            activeSpeaker
        )
        .setVisible(true);

    dialogueText
        .setText(
            activeDialogue[0]
        )
        .setVisible(true);

    dialogueHint.setVisible(true);


    if (mobileInteractButton) {

        mobileInteractButton.style.display =
            "block";

    }

}


function nextDialogue() {

    dialogueIndex++;


    if (
        dialogueIndex <
        activeDialogue.length
    ) {

        dialogueText.setText(
            activeDialogue[
                dialogueIndex
            ]
        );

        return;

    }


    endDialogue();

}


function endDialogue() {

    dialogueActive = false;


    dialogueBox.setVisible(false);

    dialogueName.setVisible(false);

    dialogueText.setVisible(false);

    dialogueHint.setVisible(false);

    messageText.setVisible(true);


    if (mobileInteractButton) {

        mobileInteractButton.style.display =
            "none";

    }


    const callback =
        dialogueFinishedCallback;

    dialogueFinishedCallback = null;


    if (callback) {

        callback();

    }

}


/* =========================================================
   FINAL ENDING
========================================================= */

function finishGame() {

    gameFinished = true;

    player.body.setVelocity(0);

    player.anims.stop();


    /*
        Make player face CJ.
    */

    player.setFrame(1);


    /*
        Hearts around the characters.
    */

    const positions = [
        [1350, 115],
        [1380, 75],
        [1410, 60],
        [1440, 75],
        [1470, 115],
        [1360, 175],
        [1460, 175]
    ];


    positions.forEach(
        (position, index) => {

            const heart =
                sceneRef.add.image(
                    position[0],
                    position[1],
                    "heart"
                );

            heart.setScale(1.8);

            heart.setDepth(150);

            heart.setAlpha(0);


            sceneRef.tweens.add({
                targets: heart,
                alpha: 1,
                y: position[1] - 15,
                duration: 600,
                delay: index * 120,
                yoyo: true,
                repeat: -1
            });

        }
    );


    sceneRef.cameras.main.flash(
        450,
        255,
        160,
        190
    );


    /*
        Final overlay.
    */

    const overlay =
        sceneRef.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x100b13,
            0.90
        )
        .setScrollFactor(0)
        .setDepth(500);


    const title =
        sceneRef.add.text(
            GAME_WIDTH / 2,
            155,
            "QUEST COMPLETE ♥",
            {
                fontFamily: "monospace",
                fontSize: "32px",
                fontStyle: "bold",
                color: "#ff8fb4",
                align: "center"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(501);


    const ending =
        sceneRef.add.text(
            GAME_WIDTH / 2,
            250,
            "You found all three hearts,\nmade it through every obstacle,\nand found me at the end.\n\nHappy Monthsary. ♥",
            {
                fontFamily: "monospace",
                fontSize: "20px",
                color: "#ffffff",
                align: "center",
                lineSpacing: 9
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(501);


    const small =
        sceneRef.add.text(
            GAME_WIDTH / 2,
            365,
            "If life is an adventure,\nI'm glad you're on my team.",
            {
                fontFamily: "monospace",
                fontSize: "16px",
                color: "#d9c9dc",
                align: "center"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(501);


    /*
        Hide ordinary HUD.
    */

    heartText.setVisible(false);

    hpText.setVisible(false);

    keyText.setVisible(false);

    questText.setVisible(false);

    messageText.setVisible(false);

    areaText.setVisible(false);

    interactPrompt.setVisible(false);

}


/* =========================================================
   UI
========================================================= */

function createUI(scene) {

    /*
    ========================================================
    HUD PANEL
    ========================================================
    */

    const hud =
    scene.add.rectangle(
                115,
                67,
                200,
                88,
            0x111016,
            0.92
        );

    hud.setStrokeStyle(
        2,
        0xffffff
    );

    hud
        .setScrollFactor(0)
        .setDepth(10000);


    heartText =
        scene.add.text(
            25,
            35,
            "♥ Hearts: 0 / 3",
            {
                fontFamily: "monospace",
                fontSize: "15px",
                color: "#ff8fb4"
            }
        )
        .setScrollFactor(0)
        .setDepth(10001);


    hpText =
        scene.add.text(
            25,
            60,
            "HP: ♥♥♥",
            {
                fontFamily: "monospace",
                fontSize: "15px",
                color: "#ffffff"
            }
        )
        .setScrollFactor(0)
        .setDepth(10001);


    keyText =
        scene.add.text(
            25,
            84,
            "🔑 No Key",
            {
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#d9c9dc"
            }
        )
        .setScrollFactor(0)
        .setDepth(10001);


    /*
    ========================================================
    QUEST
    ========================================================
    */

    questText =
        scene.add.text(
            GAME_WIDTH - 25,
            28,
            "QUEST\nFind Heart #1 in the west forest.",
            {
                fontFamily: "monospace",
                fontSize: "15px",
                color: "#ffffff",
                align: "right",
                backgroundColor: "#111016",
                padding: {
                    x: 12,
                    y: 10
                },
                wordWrap: {
                    width: 240
                }
            }
        )
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(10001);


    /*
    ========================================================
    AREA NAME
    ========================================================
    */

    areaText =
        scene.add.text(
            GAME_WIDTH / 2,
            28,
            "WEST FOREST",
            {
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#ffffff",
                backgroundColor: "#111016",
                padding: {
                    x: 10,
                    y: 6
                }
            }
        )
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(10001);


    /*
    ========================================================
    MESSAGE
    ========================================================
    */

    messageText =
        scene.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 28,
            "",
            {
                fontFamily: "monospace",
                fontSize: "16px",
                color: "#ffffff",
                backgroundColor: "#111016",
                padding: {
                    x: 13,
                    y: 8
                },
                align: "center",
                wordWrap: {
                    width: 650
                }
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10020);

    messageText.setVisible(false);


    /*
    ========================================================
    INTERACTION PROMPT
    ========================================================
    */

    interactPrompt =
        scene.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 105,
            "E  INTERACT",
            {
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#ffffff",
                backgroundColor: "#ff5f96",
                padding: {
                    x: 12,
                    y: 7
                }
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10030)
        .setVisible(false);


    /*
    ========================================================
    DIALOGUE BOX
    ========================================================
    */

    dialogueBox =
    scene.add.rectangle(
        GAME_WIDTH / 2,
        427,
        700,
        112,
        0x111016,
        0.96
    );

    dialogueBox.setStrokeStyle(
        4,
        0xffffff
    );

    dialogueBox
        .setScrollFactor(0)
        .setDepth(11000)
        .setVisible(false);


    dialogueName =
    scene.add.text(
        65,
        383,
            "",
            {
                fontFamily: "monospace",
                fontSize: "19px",
                fontStyle: "bold",
                color: "#ff8fb4"
            }
        )
        .setScrollFactor(0)
        .setDepth(11001)
        .setVisible(false);


    dialogueText =
    scene.add.text(
        65,
        411,
            "",
            {
                fontFamily: "monospace",
                fontSize: "15px",
                color: "#ffffff",
                lineSpacing: 6,
                wordWrap: {
                    width: 590
                }
            }
        )
        .setScrollFactor(0)
        .setDepth(11001)
        .setVisible(false);


    dialogueHint =
    scene.add.text(
        740,
        470,
            "E ▼",
            {
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#bfb5c2"
            }
        )
        .setOrigin(1)
        .setScrollFactor(0)
        .setDepth(11001)
        .setVisible(false);

}


/* =========================================================
   QUEST UPDATE
========================================================= */

function updateQuest(text) {

    questText.setText(
        "QUEST\n" +
        text
    );

}


/* =========================================================
   TEMPORARY MESSAGE
========================================================= */

let messageTimer = null;


function showTemporaryMessage(
    text,
    duration = 2200
) {

    if (!messageText) {

        return;

    }


    messageText
        .setText(text)
        .setVisible(true);


    if (messageTimer) {

        messageTimer.remove(false);

    }


    messageTimer =
        sceneRef.time.delayedCall(
            duration,
            () => {

                if (
                    !dialogueActive &&
                    !gameFinished
                ) {

                    messageText
        .setText("")
        .setVisible(false);

                }

            }
        );

}


/* =========================================================
   AREA NAME
========================================================= */

function updateAreaName() {

    let name = "WEST FOREST";


    if (
        player.x > 700 &&
        player.x < 890
    ) {

        name = "OLD RIVER";

    }

    else if (
        player.x >= 890 &&
        player.y > 500
    ) {

        name = "EAST MEADOW";

    }

    else if (
        player.x >= 980 &&
        player.y <= 500 &&
        !finalGateUnlocked
    ) {

        name = "OVERTHINKING TRAIL";

    }

    else if (
        finalGateUnlocked &&
        player.x >= 1260 &&
        player.y < 350
    ) {

        name = "SECRET GARDEN";

    }


    areaText.setText(name);

}


/* =========================================================
   GENERATED PIXEL TEXTURES
========================================================= */

function createPixelTextures(scene) {

    createHeartTexture(scene);

    createTreeTexture(scene);

    createGrassTexture(scene);

    createRockTexture(scene);

    createKeyTexture(scene);

    createShadowTexture(scene);

    createCheckpointTexture(scene);

    createFlowerTexture(scene);

    createSignTexture(scene);

    createCJTexture(scene);

}


/* =========================================================
   PLACEHOLDER PLAYER SPRITESHEET

   Used only when assets/girlfriend_final_phaser_clean_v2.png
   is missing. Builds a simple 12-frame pixel-art character
   (4 directions x idle/walk1/walk2) on an offscreen canvas
   and registers it under the "girlfriend" key, so every other
   part of the game (animations, frame indices) works exactly
   as it would with the real art.
========================================================= */

function createPlaceholderGirlfriendTexture(scene) {

    const frameWidth = 128;
    const frameHeight = 160;

    const directions = [
        "down",
        "up",
        "left",
        "right"
    ];

    const canvas =
        document.createElement("canvas");

    canvas.width = frameWidth * 4;
    canvas.height = frameHeight * 3;

    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;


    for (let row = 0; row < 3; row++) {

        for (let col = 0; col < 4; col++) {

            drawPlaceholderFrame(
                ctx,
                col * frameWidth,
                row * frameHeight,
                frameWidth,
                frameHeight,
                directions[col],
                row
            );

        }

    }


    scene.textures.addSpriteSheet(
        "girlfriend",
        canvas,
        {
            frameWidth,
            frameHeight
        }
    );

}


function drawPlaceholderFrame(
    ctx,
    offsetX,
    offsetY,
    width,
    height,
    direction,
    walkFrame
) {

    /*
        Simple blocky pixel-art person, drawn in 8px "pixels"
        so it reads cleanly even upscaled. walkFrame 0 = idle,
        1/2 = alternating step poses (legs shift + tiny bob).
    */

    const px = 8;

    const bob =
        walkFrame === 0
            ? 0
            : (walkFrame === 1 ? -px : px);

    const legOffset =
        walkFrame === 0
            ? 0
            : (walkFrame === 1 ? px : -px);

    const cx = offsetX + width / 2;
    const topY = offsetY + height / 2 - 9 * px + bob;

    const draw = (dx, dy, w, h, color) => {

        ctx.fillStyle = color;

        ctx.fillRect(
            cx + dx * px,
            topY + dy * px,
            w * px,
            h * px
        );

    };


    /* Shadow on the ground, always facing the camera. */

    ctx.fillStyle = "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(
        cx,
        offsetY + height / 2 + 9 * px,
        4.2 * px,
        1.1 * px,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Hair (back layer, wider than face). */

    draw(-2.2, -0.3, 4.4, 4, "#3a2440");

    /* Face. */

    draw(-1.6, 0, 3.2, 3, "#f2c6a0");

    /* Body / dress. */

    draw(-2, 3, 4, 4.5, "#ff5c8a");

    /* Arms — swing slightly opposite the legs for a walk feel. */

    draw(-2.6, 3.2, 0.8, 3, "#f2c6a0");
    draw(1.8, 3.2, 0.8, 3, "#f2c6a0");

    /* Legs, offset to suggest a walk cycle. */

    draw(-1.6 + legOffset / px * 0.3, 7.5, 1.2, 2.5, "#3a2440");
    draw(0.4 - legOffset / px * 0.3, 7.5, 1.2, 2.5, "#3a2440");

    /* Shoes. */

    draw(-1.6 + legOffset / px * 0.3, 9.8, 1.2, 0.9, "#1c1420");
    draw(0.4 - legOffset / px * 0.3, 9.8, 1.2, 0.9, "#1c1420");


    /* Directional face detail on top of the face block. */

    ctx.fillStyle = "#2a1f33";

    if (direction === "down") {

        draw(-1, 0.9, 0.6, 0.6, "#2a1f33");
        draw(0.4, 0.9, 0.6, 0.6, "#2a1f33");

    }

    else if (direction === "up") {

        /* Back of the head — just hair, no face features. */

        draw(-2.2, -0.3, 4.4, 4.3, "#3a2440");

    }

    else if (direction === "left") {

        draw(-1.4, 0.9, 0.7, 0.7, "#2a1f33");

    }

    else if (direction === "right") {

        draw(0.7, 0.9, 0.7, 0.7, "#2a1f33");

    }

}


/* =========================================================
   HEART TEXTURE
========================================================= */

function createHeartTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

    g.fillStyle(
        0xff315f
    );

    g.fillRect(2, 1, 3, 3);
    g.fillRect(7, 1, 3, 3);
    g.fillRect(1, 3, 10, 3);
    g.fillRect(2, 6, 8, 2);
    g.fillRect(3, 8, 6, 2);
    g.fillRect(4, 10, 4, 1);
    g.fillRect(5, 11, 2, 1);

    g.fillStyle(
        0xffa0b6
    );

    g.fillRect(3, 2, 1, 2);

    g.generateTexture(
        "heart",
        12,
        12
    );

    g.destroy();

}


/* =========================================================
   TREE TEXTURE
========================================================= */

function createTreeTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    g.fillStyle(
        0x315f36
    );

    g.fillRect(
        4,
        5,
        16,
        12
    );

    g.fillRect(
        7,
        1,
        10,
        18
    );


    g.fillStyle(
        0x438849
    );

    g.fillRect(
        6,
        4,
        9,
        6
    );


    g.fillStyle(
        0x70452d
    );

    g.fillRect(
        10,
        16,
        5,
        8
    );


    g.generateTexture(
        "tree",
        24,
        24
    );

    g.destroy();

}


/* =========================================================
   GRASS TEXTURE
========================================================= */

function createGrassTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    g.fillStyle(
        0x438c43
    );

    g.fillRect(3, 4, 1, 4);
    g.fillRect(5, 2, 1, 6);
    g.fillRect(7, 4, 1, 4);


    g.generateTexture(
        "grass",
        10,
        10
    );

    g.destroy();

}


/* =========================================================
   ROCK TEXTURE
========================================================= */

function createRockTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    g.fillStyle(
        0x56515f
    );

    g.fillRect(
        4,
        6,
        18,
        13
    );

    g.fillRect(
        7,
        3,
        12,
        18
    );


    g.fillStyle(
        0x777080
    );

    g.fillRect(
        8,
        5,
        8,
        4
    );


    g.fillStyle(
        0x403b48
    );

    g.fillRect(
        5,
        17,
        16,
        4
    );


    g.generateTexture(
        "rock",
        26,
        24
    );

    g.destroy();

}


/* =========================================================
   KEY TEXTURE
========================================================= */

function createKeyTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    g.fillStyle(
        0xf5cf56
    );

    g.fillRect(
        2,
        3,
        6,
        6
    );

    g.fillStyle(
        0x73b85e
    );

    g.fillRect(
        4,
        5,
        2,
        2
    );

    g.fillStyle(
        0xf5cf56
    );

    g.fillRect(
        7,
        5,
        8,
        2
    );

    g.fillRect(
        12,
        7,
        2,
        3
    );

    g.fillRect(
        9,
        7,
        2,
        2
    );


    g.generateTexture(
        "key",
        16,
        12
    );

    g.destroy();

}


/* =========================================================
   SHADOW TEXTURE
========================================================= */

function createShadowTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    /*
    ========================================================
    LOW-BUDGET PAC-MAN GHOST
    ========================================================
    */

    g.fillStyle(
        0x6f3f7f
    );

    /*
        Rounded-ish head.
    */

    g.fillRect(
        4,
        5,
        16,
        13
    );

    g.fillRect(
        6,
        3,
        12,
        2
    );

    g.fillRect(
        3,
        8,
        18,
        10
    );


    /*
        Bottom ghost feet.
    */

    g.fillRect(
        3,
        18,
        5,
        4
    );

    g.fillRect(
        10,
        18,
        4,
        4
    );

    g.fillRect(
        16,
        18,
        5,
        4
    );


    /*
        Eyes.
    */

    g.fillStyle(
        0xffffff
    );

    g.fillRect(
        6,
        9,
        5,
        5
    );

    g.fillRect(
        14,
        9,
        5,
        5
    );


    /*
        Pupils.
    */

    g.fillStyle(
        0x1c1630
    );

    g.fillRect(
        8,
        11,
        2,
        2
    );

    g.fillRect(
        16,
        11,
        2,
        2
    );


    g.generateTexture(
        "shadow",
        24,
        24
    );

    g.destroy();

}


/* =========================================================
   CHECKPOINT TEXTURE
========================================================= */

function createCheckpointTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    g.fillStyle(
        0x4f3f54
    );

    g.fillRect(
        6,
        8,
        6,
        14
    );


    g.fillStyle(
        0xff8fb4
    );

    g.fillRect(
        3,
        2,
        12,
        8
    );


    g.fillStyle(
        0xffffff
    );

    g.fillRect(
        7,
        4,
        4,
        4
    );


    g.generateTexture(
        "checkpoint",
        18,
        24
    );

    g.destroy();

}


/* =========================================================
   FLOWER TEXTURE
========================================================= */

function createFlowerTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    g.fillStyle(
        0xff8fb4
    );

    g.fillRect(3, 1, 2, 2);
    g.fillRect(1, 3, 2, 2);
    g.fillRect(5, 3, 2, 2);
    g.fillRect(3, 5, 2, 2);


    g.fillStyle(
        0xf8df67
    );

    g.fillRect(
        3,
        3,
        2,
        2
    );


    g.fillStyle(
        0x397344
    );

    g.fillRect(
        4,
        7,
        1,
        4
    );


    g.generateTexture(
        "flower",
        8,
        12
    );

    g.destroy();

}


/* =========================================================
   SIGN TEXTURE
========================================================= */

function createSignTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    g.fillStyle(
        0x6c482c
    );

    g.fillRect(
        11,
        12,
        4,
        12
    );


    g.fillStyle(
        0xb77c43
    );

    g.fillRect(
        2,
        3,
        22,
        12
    );


    g.fillStyle(
        0x8a5c35
    );

    g.fillRect(
        4,
        5,
        18,
        2
    );


    g.generateTexture(
        "sign",
        26,
        25
    );

    g.destroy();

}


/* =========================================================
   CJ TEXTURE
========================================================= */

function createCJTexture(scene) {

    const g =
        scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });


    /*
        Short black hair.
    */

    g.fillStyle(
        0x17171d
    );

    g.fillRect(
        4,
        1,
        10,
        3
    );

    g.fillRect(
        3,
        3,
        12,
        4
    );


    /*
        Face.
    */

    g.fillStyle(
        0xe5aa82
    );

    g.fillRect(
        5,
        6,
        8,
        6
    );


    /*
        Glasses.
    */

    g.fillStyle(
        0x111111
    );

    g.fillRect(
        5,
        7,
        3,
        2
    );

    g.fillRect(
        10,
        7,
        3,
        2
    );

    g.fillRect(
        8,
        7,
        2,
        1
    );


    /*
        Shirt.
    */

    g.fillStyle(
        0x18181d
    );

    g.fillRect(
        4,
        12,
        10,
        7
    );


    /*
        Arms.
    */

    g.fillStyle(
        0xe5aa82
    );

    g.fillRect(
        2,
        13,
        2,
        6
    );

    g.fillRect(
        14,
        13,
        2,
        6
    );


    /*
        Pants.
    */

    g.fillStyle(
        0x252b38
    );

    g.fillRect(
        5,
        19,
        4,
        7
    );

    g.fillRect(
        10,
        19,
        4,
        7
    );


    /*
        Shoes.
    */

    g.fillStyle(
        0x101014
    );

    g.fillRect(
        4,
        26,
        5,
        2
    );

    g.fillRect(
        10,
        26,
        5,
        2
    );


    g.generateTexture(
        "cj",
        18,
        29
    );

    g.destroy();

}


/* =========================================================
   MOBILE CONTROLS
========================================================= */

function setupMobileControls() {

    const buttons = {
        upBtn: "up",
        downBtn: "down",
        leftBtn: "left",
        rightBtn: "right"
    };


    Object.entries(buttons)
        .forEach(
            ([id, direction]) => {

                const button =
                    document.getElementById(
                        id
                    );


                if (!button) {

                    return;

                }


                const startMove =
                    event => {

                        event.preventDefault();

                        setDirection(
                            direction,
                            true
                        );

                    };


                const stopMove =
                    event => {

                        event.preventDefault();

                        setDirection(
                            direction,
                            false
                        );

                    };


                button.addEventListener(
                    "pointerdown",
                    startMove
                );

                button.addEventListener(
                    "pointerup",
                    stopMove
                );

                button.addEventListener(
                    "pointerleave",
                    stopMove
                );

                button.addEventListener(
                    "pointercancel",
                    stopMove
                );

            }
        );

}


/* =========================================================
   MOBILE INTERACT BUTTON
========================================================= */

function createMobileInteractButton() {

    mobileInteractButton =
        document.getElementById(
            "interactBtn"
        );


    if (!mobileInteractButton) {

        return;

    }


    mobileInteractButton.style.display =
        "none";


    mobileInteractButton.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();


            if (dialogueActive) {

                nextDialogue();

                return;

            }


            performInteraction();

        }
    );

}


/* =========================================================
   MOBILE MOVEMENT STATE
========================================================= */

function setDirection(
    direction,
    value
) {

    if (direction === "up") {

        moveUp = value;

    }


    if (direction === "down") {

        moveDown = value;

    }


    if (direction === "left") {

        moveLeft = value;

    }


    if (direction === "right") {

        moveRight = value;

    }

}