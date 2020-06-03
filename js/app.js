const rowCount = 10;
// Define el tetromino en forma de "L"
const lTetromino = [
    /* Según la foto "tetrominios.jpg", teniendo en cuenta que cada fila tiene 10 cuadrados,
        definimos en cada uno de los arrays las posiciones (de 0 a 299) de las celdas de la figura
    */
    [1, rowCount+1, rowCount*2+1, 2],
    [rowCount, rowCount+1, rowCount+2, rowCount*2+2],
    [1, rowCount+1, rowCount+1, rowCount*2, rowCount*2+1],
    [rowCount, rowCount*2, rowCount*2+1, rowCount*2+2]
];
const zTetromino = [
    [0,rowCount,rowCount+1,rowCount*2+1],
    [rowCount+1, rowCount+2,rowCount*2,rowCount*2+1],
    [0,rowCount,rowCount+1,rowCount*2+1],
    [rowCount+1, rowCount+2,rowCount*2,rowCount*2+1]
];
const tTetromino = [
    [1,rowCount,rowCount+1,rowCount+2],
    [1,rowCount+1,rowCount+2,rowCount*2+1],
    [rowCount,rowCount+1,rowCount+2,rowCount*2+1],
    [1,rowCount,rowCount+1,rowCount*2+1]
];

const oTetromino = [
    [0,1,rowCount,rowCount+1],
    [0,1,rowCount,rowCount+1],
    [0,1,rowCount,rowCount+1],
    [0,1,rowCount,rowCount+1]
];

const iTetromino = [
    [1,rowCount+1,rowCount*2+1,rowCount*3+1],
    [rowCount,rowCount+1,rowCount+2,rowCount+3],
    [1,rowCount+1,rowCount*2+1,rowCount*3+1],
    [rowCount,rowCount+1,rowCount+2,rowCount+3]
];

const tetrominos = [ lTetromino, zTetromino, tTetromino, oTetromino, iTetromino ];
const classes = [ 'l', 'z', 't', 'o', 'i' ];

const DEFAULT_TIME = 600;
let TIME = DEFAULT_TIME; // cada "TIME"ms se mueve la figura una línea hacia abajo
let currentPosition = 4;
let currentRotation = 0;
let currentTetrominoPositions = [];
let gridSquares = [];
let timerId;
let gameStarted = false;
let paused = false;
let currentTetrominoRandomIdx = -1;
let nextTetrominoRandomIdx = -1;
let score = 0;
let volumeOn = true;

const grid = document.querySelector('.grid');
const scoreDisplay = document.querySelector('#score');
const audio = document.getElementById('audio');
audio.loop = true;

document.addEventListener('DOMContentLoaded', () => {
    gridSquares = Array.from( document.querySelectorAll('.grid div:not(.before__grid)') ); 
    keyboardControl();

    document.addEventListener('swiped-left', () => {
        if( !paused ){
            rotatePosition();
        }
    });
    document.addEventListener('swiped-right', () => {
        if( !paused ){
            rotatePosition();
        }
    });
});

// Crea una nueva figura "tetromino"
const newTetromino = () => {
    currentPosition = 4;
    currentRotation = 0; // La rotación (posición) de la figura (cada figura tiene 4 posiciones diferentes que puede tomar)
    currentTetrominoRandomIdx = currentTetrominoRandomIdx < 0 ?  Math.floor(Math.random()*tetrominos.length) : nextTetrominoRandomIdx;
    nextTetrominoRandomIdx = Math.floor(Math.random()*tetrominos.length);
    drawTetromino( true );
    displayNextTetromino();
    timerId = setInterval( () => {
        moveDown();
    }, TIME );
};

const drawTetromino = ( draw ) => {
    currentTetrominoPositions = tetrominos[currentTetrominoRandomIdx][currentRotation];
    for( const pos of currentTetrominoPositions ){
        const classList = gridSquares[pos+currentPosition].classList;
        if( draw ){
            classList.add('tetromino');
            classList.add( classes[currentTetrominoRandomIdx] );
        } else{
            classList.remove('tetromino');
            classList.remove( classes[currentTetrominoRandomIdx] );
        }
    }
};

const displayNextTetromino = () => {
    const displayRowCount = 4;
    const displayTetrominos = [
        [1, displayRowCount+1, displayRowCount*2+1, 2],
        [0,displayRowCount,displayRowCount+1,displayRowCount*2+1],
        [1,displayRowCount,displayRowCount+1,displayRowCount+2],
        [0,1,displayRowCount,displayRowCount+1],
        [1,displayRowCount+1,displayRowCount*2+1,displayRowCount*3+1]
    ];
    const displayGridSquares = Array.from(document.querySelectorAll('.next-figure-grid div'));
    for( const square of displayGridSquares ){
        square.classList.remove('tetromino');
        for( const cls of classes ){
            square.classList.remove( cls );
        }
    }
    const nextTetrominoPositions = displayTetrominos[nextTetrominoRandomIdx];
    for( const nextTetrominoPosition of nextTetrominoPositions ){
        displayGridSquares[nextTetrominoPosition].classList.add('tetromino');
        displayGridSquares[nextTetrominoPosition].classList.add( classes[nextTetrominoRandomIdx] );
    }
};

const moveDown = () => {
    const freezed = freeze();
    if( !freezed ){
        drawTetromino( false );
        currentPosition += rowCount;
        drawTetromino( true );
    }
};

const freeze = () => {
    /* ¿Algún cuadrado del tetromino ha llegado a la última fila o tiene otro tetromino debajo? Lo averiguamos
        comprobando si algún elemento de la siguiente fila tiene la clase "taken"
    */
    const contains = currentTetrominoPositions.some( ( tetroMinoPosition ) => {
        return gridSquares[currentPosition + tetroMinoPosition + rowCount].classList.contains('taken');
    });
    if( contains ){
        for( const pos of currentTetrominoPositions ){
            gridSquares[currentPosition + pos].classList.add('taken');
        }
        checkline();
        clearInterval(timerId);
        newTetromino();
    }
    return contains;
};

const checkValidPositionLeft = ( forRotation ) => {
    // Indica si alguna de las celdas del tetromino está en la primera columna del grid
    const isAtLeftEdge = currentTetrominoPositions.some( (tetrominoPosition) => {
        if( forRotation ){
            return (currentPosition + tetrominoPosition)%rowCount < 0;
        } else{
            return (currentPosition + tetrominoPosition)%rowCount == 0;
        }
    });
    // ¿Tiene un tetromino a la izquierda?
    const hasTetrominoNext = currentTetrominoPositions.some( (tetroMinoPosition) => {
        return gridSquares[currentPosition+tetroMinoPosition-1].classList.contains('taken');
    });
    return !isAtLeftEdge && !hasTetrominoNext;
};

const checkValidPositionRight = ( forRotation ) => {
    // ¿Tiene alguna pieza en la pared de la derecha?
    const isAtRightEdge = currentTetrominoPositions.some( (tetrominoPosition) => {
        if( forRotation ){
            return (currentPosition + tetrominoPosition)%rowCount == rowCount;
        } else{
            return (currentPosition + tetrominoPosition)%rowCount == rowCount -1;
        }
    });
    // ¿Tiene un tetromino a la derecha?
    const hasTetrominoNext = currentTetrominoPositions.some( (tetroMinoPosition) => {
        return gridSquares[currentPosition+tetroMinoPosition+1].classList.contains('taken');
    });
    return !isAtRightEdge && !hasTetrominoNext;
};

const checkValidPositionBotom = () => {
    const hasTetrominoBottom = currentTetrominoPositions.some( (tetroMinoPosition) => {
        return gridSquares[currentPosition+tetroMinoPosition+rowCount].classList.contains('taken');
    });
    return !hasTetrominoBottom;
};

const checkValidRotation = () => {
    return checkValidPositionLeft( true ) && checkValidPositionRight( true ) && checkValidPositionBotom();
};

const moveLeft = () =>{
    drawTetromino( false ); 
    if( checkValidPositionLeft( false ) ){
        currentPosition -= 1;
    }
    drawTetromino( true ); 
};

const moveRight = () => {
    drawTetromino( false );
    if( checkValidPositionRight( false ) ){
        currentPosition += 1;
    }
    drawTetromino( true );
};

const rotatePosition = () => {
    drawTetromino( false );
    currentRotation = (currentRotation+1)%currentTetrominoPositions.length;
    drawTetromino( true );
    // Comprobamos si la rotación es válida; si no lo es, volvemos a la posición anterior (lo "desdibujamos")
    if( !checkValidRotation() ){
        drawTetromino( false );
        currentRotation--;
        if( currentRotation < 0 ){
            currentRotation = currentTetrominoPositions.length-1;
        }
        drawTetromino( true );
    }
};

const keyboardControl = () => {
    document.addEventListener( 'keyup', (e) => {
        if( e.keyCode === 37 && !paused ){ // Flecha izquierda
            moveLeft();
        }
        if( e.keyCode === 39 && !paused ){ // Flecha derecha
            moveRight();
        }
        if( e.keyCode == 38 && !paused ){ // Flecha superior
            rotatePosition();
        }
        if( e.keyCode === 40 && !paused ){ // Flecha inferior
            moveDown();
        }
        if( e.keyCode === 32 && !paused ){ // Espacio
            startPause();
        }
    });
};

const startPause = () => {
    if( !gameStarted ){
        gameStarted = true;
        newTetromino();
    } else{
        if( paused ){
            paused = false;
            timerId = setInterval( () => {
                moveDown();
            }, TIME );
        } else{
            paused = true;
            clearInterval(timerId);
        }
    }
    togglePlayPauseIcon(!paused);
    if( !paused && volumeOn ){
        audio.play();
    } else if( volumeOn ) {
        audio.pause();
    }
};

const togglePlayPauseIcon = ( isStart ) => {
    const startButtonIcon = document.querySelector('#start-button i[class~="material-icons"]');
    if( isStart ){
        startButtonIcon.innerHTML = 'pause';
    } else{
        startButtonIcon.innerHTML = 'play_arrow';
    }
};

const checkline = () => {
    for( let i = 0; i < 199; i+=10 ){
        const row = gridSquares.slice(i, i+10);
        // Toda una fila tiene la clase 'taken' => hemos hecho línea
        const isLine = row.every( (square) => {
            return square.classList.contains('taken');
        });
        if( isLine ){
            // Eliminamos los cuadrados de la fila del dom
            for( let n = 0; n < 10; n++ ){
                gridSquares[i+n].remove();
            }
            // Insertamos una nueva fila al principio del grid
            for( let n = 0; n < 10; n++ ){
                const div = document.createElement('DIV');
                grid.insertBefore( div, grid.firstChild );
            }
            // Incrementamos la puntuación
            score += 10;
            scoreDisplay.innerHTML = score;
            // Reseteamos el array de cuadrados
            gridSquares = Array.from(document.querySelectorAll('.grid div:not(.before__grid)'));
        }
    }
};

const setVolume = () => {
    const volumeButtonIconEl = document.querySelector('#volume-button i');
    if( volumeOn ){
        volumeButtonIconEl.innerHTML = 'volume_mute';
    } else{
        volumeButtonIconEl.innerHTML = 'volume_up';
    }
    volumeOn = !volumeOn;
    if( volumeOn && !paused ){
        this.audio.play();
    } else if( !paused ) {
        this.audio.pause();
    }
};