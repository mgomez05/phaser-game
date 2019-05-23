
    console.log("You've started the game")

    var game_width = 800;
    var game_height = 600;
    var score = 0  // The actual score of the game
    var scoreText; // Text object to display score

    var config = {
        type: Phaser.AUTO, 
        width: game_width,
        height: game_height,

        // Add physics support to the game
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300},
                debug: false
            }
        },
        
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    var game = new Phaser.Game(config);

    function preload ()
    {
        // Load assets from the assets folder
        // The first argument is the key that can be used
        // to reference the asset
        this.load.image('sky',    'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star',   'assets/star.png');
        this.load.image('bomb',   'assets/bomb.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 }
    );
    }

    function create ()
    {

        /////////////////////////////////////
        // Set up background and platforms //
        /////////////////////////////////////

        // Add an image and set its position to the center of the screen
        // By default, images are positioned using their center
        this.add.image(game_width / 2, game_height / 2, 'sky');

        // Create a group of platforms that are physics enabled,
        // and create each platform
        platforms = this.physics.add.staticGroup();

        // Create the lower platform of the screen
        //  -We scale it by two so it can cover the whole screen width
        //  -We call refreshBody() because the physics body is STATIC,
        //   and we need to tell the physics world to update
        platforms.create(400, 568, 'ground')
                 .setScale(2)
                 .refreshBody();
        
        platforms.create(600, 400, 'ground');
        platforms.create(50,  250, 'ground');
        platforms.create(750, 220, 'ground');

        ///////////////////////////////////////
        // Set up the player with properties //
        ///////////////////////////////////////

        // Create player sprite, positioned at 100 x 450 pixels from the bottom
        // of the game
        //  -Since it was created via this.physics.add, it has a Dynamic
        //   physics body by default
        player = this.physics.add.sprite(100, 450, 'dude');

        // Player will bounce slightly after landing after a jump
        player.setBounce(0.2);

        // Player can't run outside of the screen area
        player.setCollideWorldBounds(true); 

        // Set a collider between the player and the platforms
        this.physics.add.collider(player, platforms);

        //////////////////////////////
        // Set up player animations //
        //////////////////////////////

        // Set up the left animation
        //  -Uses frames 0 to 3 in an array of animations
        //  -Animation runs at 10 frames per second
        //  -"repeat: -1" means to loop
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', 
                                                    { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4}],
            frameRate: 20
        });

        // Set up the right animation
        //  -Uses frames 5 to 8 in an array of animations
        //  -Animation runs at 10 frames per second
        //  -"repeat: -1" means to loop
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', 
                                                    { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        ////////////////////////
        // Create cursor keys //
        ////////////////////////

        // Create listeners for the arrow keys <- ^ v ->
        //   -We'll set what happens on arrow key presses in the update() function
        cursors = this.input.keyboard.createCursorKeys();

        ///////////////
        // Add Stars //
        ///////////////

        // Create the star physics group
        //  -Creates 1 child automatically, and repeats 11 times
        //   to create 12 stars
        //  -Space out the stars 80 pixels horizontally from each other
        stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70}
        })

        // Set the bounce value randomly for each of the stars
        //  -0 would mean no bounce
        //  -1 would mean a full bounce
        stars.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
        })

        // Add a collider between the stars and the platform
        this.physics.add.collider(stars, platforms);

        // Make overlap listener to check when player overlaps a star
        //  -If player overlaps a star, call the collectStar function
        this.physics.add.overlap(player, stars, collectStar, null, this);

        // Set up the scoreText text display
        //   -Display it at coordinates 16 x 16 with the default string 'score: 0'
        //   -Font default is Courier
        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000'})

        //////////////////
        // Set Up Bombs //
        //////////////////
        
        // Create the bomb physics group
        bombs = this.physics.add.group();

        // Set up collision detection between bombs and platforms
        this.physics.add.collider(bombs, platforms);
        
        // Set up collision detection between bombs and player, 
        // and call hitBomb() when a collision occurs
        this.physics.add.collider(player, bombs, hitBomb, null, this)

    }

    function hitBomb (player, bomb) 
    {
        // Stop the game physics
        this.physics.pause()

        // Turn the player red
        player.setTint(0xff0000);

        player.anims.play('turn');

        // Stop the game
        gameOver = true;
    }

    // Called when a player overlaps with a star
    //  -Disables the star's physics body
    //  -Makes the star inactive and invisible
    function collectStar(player, star) 
    {
        star.disableBody(true, true);

        // Update the score and display the new score to the user
        score += 10;
        scoreText.setText('Score: ' + score);

        // If all the stars have been collected, set up a bomb with stars
        if (stars.countActive(true) === 0)
        {

            // Re-enable all the stars and set them to the same x position and 
            // at a y position of 0
            stars.children.iterate(function (child) {

                child.enableBody(true, child.x, 0, true, true);
            });

            // Pick a random x coordinate on the opposite side of the player
            var x = (player.x < 400) ? Phaser.Math.Between(game_width / 2, game_width) : 
                                       Phaser.Math.Between(0, game_width / 2);

            // Create a bomb at the random x coordinate with a random velocity
            var bomb = bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

        }
    }

    function update ()
    {
        // Check which button was pressed
        if (cursors.left.isDown) 
        {
            player.setVelocityX(-160);
            player.anims.play('left', true);
        }
        else if (cursors.right.isDown) 
        {
            player.setVelocityX(160)
            player.anims.play('right', true)
        }

        // If no keys are pressed, have the sprite face out to human player
        else 
        {
            player.setVelocityX(0);
            player.anims.play('turn')
        }

        // If we pressed the up key and player is touching the ground
        if (cursors.up.isDown && player.body.touching.down) 
        {
            player.setVelocityY(-330)
        }
    }
