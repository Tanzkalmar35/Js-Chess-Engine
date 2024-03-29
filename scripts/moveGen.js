//	MVV = Most Valuable Victim
//	LVA = Least Valuable Agressor
var mvvLvaValue = [ 0, 100, 200, 300, 400, 500, 600, 100, 200, 300, 400, 500, 600 ];
var mvvLvaScores = new Array(14 * 14);

function initMvvLva() {
	var attacker;
	var victim;

	for (attacker = PIECES.wP; attacker <= PIECES.bK; attacker++) {
		for (victim = PIECES.wP; victim <= PIECES.bK; victim++) {
			mvvLvaScores[victim * 14 + attacker] = mvvLvaValue[victim] + 6 - (mvvLvaValue[attacker]/100);
		}
	}
}

function moveExists(move) {
	
	generateMoves();
    
	var index;
	var moveFound = move;
	for(index = gameBoard.moveListStart[gameBoard.ply]; index < gameBoard.moveListStart[gameBoard.ply + 1]; ++index) {
	
		moveFound = gameBoard.moveList[index];	
		if(makeMove(moveFound) == BOOL.FALSE) {
			continue;
		}				
		takeMove();
		if(move == moveFound) {
			return BOOL.TRUE;
		}
	}
	return BOOL.FALSE;
}

function MOVE(from, to, captured, promoted, flag) {
	return (from | (to << 7) | (captured << 14) | (promoted << 20) | flag);
}

function addCaptureMove(move) {
	gameBoard.moveList[gameBoard.moveListStart[gameBoard.ply+1]] = move;
	gameBoard.moveScores[gameBoard.moveListStart[gameBoard.ply+1]++] = mvvLvaScores[CAPTURED(move) * 14 + gameBoard.pieces[FROMSQ(move)]] + 1000000;
}

function addQuietMove(move) {
	gameBoard.moveList[gameBoard.moveListStart[gameBoard.ply+1]] = move;
	gameBoard.moveScores[gameBoard.moveListStart[gameBoard.ply+1]] = 0;

	if (move == gameBoard.searchKillers[gameBoard.ply]) {
		gameBoard.moveScores[gameBoard.moveListStart[gameBoard.ply + 1]] = 900000;;
	} else if (move == gameBoard.searchKillers[gameBoard.ply + MAXDEPTH]) {
		gameBoard.moveScores[gameBoard.moveListStart[gameBoard.ply + 1]] = 800000;;
	} else {
		gameBoard.moveScores[gameBoard.moveListStart[gameBoard.ply + 1]] = gameBoard.searchHistory[gameBoard.pieces[FROMSQ(move)] * boardSquareNumber + TOSQ(move)];
	}

	gameBoard.moveListStart[gameBoard.ply + 1]++;

}

function addEnPassantMove(move) {
	gameBoard.moveList[gameBoard.moveListStart[gameBoard.ply+1]] = move;
	gameBoard.moveScores[gameBoard.moveListStart[gameBoard.ply+1]++] = 105 + 1000000;
}

function addWhitePawnCaptureMove(from, to, cap) {
	if(ranksBoard[from]==RANKS.RANK_7) {
		addCaptureMove(MOVE(from, to, cap, PIECES.wQ, 0));
		addCaptureMove(MOVE(from, to, cap, PIECES.wR, 0));
		addCaptureMove(MOVE(from, to, cap, PIECES.wB, 0));
		addCaptureMove(MOVE(from, to, cap, PIECES.wN, 0));	
	} else {
		addCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, 0));	
	}
}

function addBlackPawnCaptureMove(from, to, cap) {
	if(ranksBoard[from]==RANKS.RANK_2) {
		addCaptureMove(MOVE(from, to, cap, PIECES.bQ, 0));
		addCaptureMove(MOVE(from, to, cap, PIECES.bR, 0));
		addCaptureMove(MOVE(from, to, cap, PIECES.bB, 0));
		addCaptureMove(MOVE(from, to, cap, PIECES.bN, 0));	
	} else {
		addCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, 0));	
	}
}

function addWhitePawnQuietMove(from, to) {
	if(ranksBoard[from]==RANKS.RANK_7) {
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wQ,0));
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wR,0));
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wB,0));
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wN,0));
	} else {
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.EMPTY,0));	
	}
}

function addBlackPawnQuietMove(from, to) {
	if(ranksBoard[from]==RANKS.RANK_2) {
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bQ,0));
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bR,0));
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bB,0));
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bN,0));
	} else {
		addQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.EMPTY,0));	
	}
}

function generateMoves() {
	gameBoard.moveListStart[gameBoard.ply+1] = gameBoard.moveListStart[gameBoard.ply];
	
	var pceType;
	var pceNum;
	var sq;
	var pieceIndex;
	var piece;
	var t_sq;
	var dir;
	
	if(gameBoard.side == COLOURS.WHITE) {
		pceType = PIECES.wP;
		
		for(pceNum = 0; pceNum < gameBoard.pieceNumber[pceType]; ++pceNum) {
			sq = gameBoard.pieceList[PIECEINDEX(pceType, pceNum)];			
			if(gameBoard.pieces[sq + 10] == PIECES.EMPTY) {
				addWhitePawnQuietMove(sq, sq+10);
				if(ranksBoard[sq] == RANKS.RANK_2 && gameBoard.pieces[sq + 20] == PIECES.EMPTY) {
					addQuietMove( MOVE(sq, sq + 20, PIECES.EMPTY, PIECES.EMPTY, moveFlagPawnStart ));
				}
			}
			
			if(squareOffboard(sq + 9) == BOOL.FALSE && pieceCol[gameBoard.pieces[sq+9]] == COLOURS.BLACK) {
				addWhitePawnCaptureMove(sq, sq + 9, gameBoard.pieces[sq+9]);
			}
			
			if(squareOffboard(sq + 11) == BOOL.FALSE && pieceCol[gameBoard.pieces[sq+11]] == COLOURS.BLACK) {
				addWhitePawnCaptureMove(sq, sq + 11, gameBoard.pieces[sq+11]);
			}			
			
			if(gameBoard.enPassant != SQUARES.NO_SQ) {
				if(sq + 9 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(sq, sq+9, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
				
				if(sq + 11 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(sq, sq+11, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
			}			
			
		}
		
		if(gameBoard.castlePerm & CASTLEBIT.WKCA) {			
			if(gameBoard.pieces[SQUARES.F1] == PIECES.EMPTY && gameBoard.pieces[SQUARES.G1] == PIECES.EMPTY) {
				if(SquareAttacked(SQUARES.F1, COLOURS.BLACK) == BOOL.FALSE && SquareAttacked(SQUARES.E1, COLOURS.BLACK) == BOOL.FALSE) {
					addQuietMove( MOVE(SQUARES.E1, SQUARES.G1, PIECES.EMPTY, PIECES.EMPTY, moveFlagCastle ));
				}
			}
		}
		
		if(gameBoard.castlePerm & CASTLEBIT.WQCA) {
			if(gameBoard.pieces[SQUARES.D1] == PIECES.EMPTY && gameBoard.pieces[SQUARES.C1] == PIECES.EMPTY && gameBoard.pieces[SQUARES.B1] == PIECES.EMPTY) {
				if(SquareAttacked(SQUARES.D1, COLOURS.BLACK) == BOOL.FALSE && SquareAttacked(SQUARES.E1, COLOURS.BLACK) == BOOL.FALSE) {
					addQuietMove( MOVE(SQUARES.E1, SQUARES.C1, PIECES.EMPTY, PIECES.EMPTY, moveFlagCastle ));
				}
			}
		}		

	} else {
		pceType = PIECES.bP;
		
		for(pceNum = 0; pceNum < gameBoard.pieceNumber[pceType]; ++pceNum) {
			sq = gameBoard.pieceList[PIECEINDEX(pceType, pceNum)];
			if(gameBoard.pieces[sq - 10] == PIECES.EMPTY) {
				addBlackPawnQuietMove(sq, sq-10);		
				if(ranksBoard[sq] == RANKS.RANK_7 && gameBoard.pieces[sq - 20] == PIECES.EMPTY) {
					addQuietMove( MOVE(sq, sq - 20, PIECES.EMPTY, PIECES.EMPTY, moveFlagPawnStart ));
				}
			}
			
			if(squareOffboard(sq - 9) == BOOL.FALSE && pieceCol[gameBoard.pieces[sq-9]] == COLOURS.WHITE) {
				addBlackPawnCaptureMove(sq, sq - 9, gameBoard.pieces[sq-9]);
			}
			
			if(squareOffboard(sq - 11) == BOOL.FALSE && pieceCol[gameBoard.pieces[sq-11]] == COLOURS.WHITE) {
				addBlackPawnCaptureMove(sq, sq - 11, gameBoard.pieces[sq-11]);
			}			
			
			if(gameBoard.enPassant != SQUARES.NO_SQ) {
				if(sq - 9 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(sq, sq-9, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
				
				if(sq - 11 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(sq, sq-11, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
			}
		}
		if(gameBoard.castlePerm & CASTLEBIT.BKCA) {	
			if(gameBoard.pieces[SQUARES.F8] == PIECES.EMPTY && gameBoard.pieces[SQUARES.G8] == PIECES.EMPTY) {
				if(SquareAttacked(SQUARES.F8, COLOURS.WHITE) == BOOL.FALSE && SquareAttacked(SQUARES.E8, COLOURS.WHITE) == BOOL.FALSE) {
					addQuietMove( MOVE(SQUARES.E8, SQUARES.G8, PIECES.EMPTY, PIECES.EMPTY, moveFlagCastle ));
				}
			}
		}
		
		if(gameBoard.castlePerm & CASTLEBIT.BQCA) {
			if(gameBoard.pieces[SQUARES.D8] == PIECES.EMPTY && gameBoard.pieces[SQUARES.C8] == PIECES.EMPTY && gameBoard.pieces[SQUARES.B8] == PIECES.EMPTY) {
				if(SquareAttacked(SQUARES.D8, COLOURS.WHITE) == BOOL.FALSE && SquareAttacked(SQUARES.E8, COLOURS.WHITE) == BOOL.FALSE) {
					addQuietMove( MOVE(SQUARES.E8, SQUARES.C8, PIECES.EMPTY, PIECES.EMPTY, moveFlagCastle ));
				}
			}
		}	
	}	
	
	pieceIndex = loopNonSlideIndex[gameBoard.side];
	piece = loopNonSlidePiece[pieceIndex++];
	
	while (piece != 0) {
		for(pceNum = 0; pceNum < gameBoard.pieceNumber[piece]; ++pceNum) {
			sq = gameBoard.pieceList[PIECEINDEX(piece, pceNum)];
			
			for(index = 0; index < directionNumber[piece]; index++) {
				dir = pieceDirection[piece][index];
				t_sq = sq + dir;
				
				if(squareOffboard(t_sq) == BOOL.TRUE) {
					continue;
				}
				
				if(gameBoard.pieces[t_sq] != PIECES.EMPTY) {
					if(pieceCol[gameBoard.pieces[t_sq]] != gameBoard.side) {
						addCaptureMove( MOVE(sq, t_sq, gameBoard.pieces[t_sq], PIECES.EMPTY, 0 ));
					}
				} else {
					addQuietMove( MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0 ));
				}
			}			
		}	
		piece = loopNonSlidePiece[pieceIndex++];
	}
	
	pieceIndex = loopSlideIndex[gameBoard.side];
	piece = loopSlidePiece[pieceIndex++];
	
	while(piece != 0) {		
		for(pceNum = 0; pceNum < gameBoard.pieceNumber[piece]; ++pceNum) {
			sq = gameBoard.pieceList[PIECEINDEX(piece, pceNum)];
			
			for(index = 0; index < directionNumber[piece]; index++) {
				dir = pieceDirection[piece][index];
				t_sq = sq + dir;
				
				while( squareOffboard(t_sq) == BOOL.FALSE ) {	
				
					if(gameBoard.pieces[t_sq] != PIECES.EMPTY) {
						if(pieceCol[gameBoard.pieces[t_sq]] != gameBoard.side) {
							addCaptureMove( MOVE(sq, t_sq, gameBoard.pieces[t_sq], PIECES.EMPTY, 0 ));
						}
						break;
					}
					addQuietMove( MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0 ));
					t_sq += dir;
				}
			}			
		}	
		piece = loopSlidePiece[pieceIndex++];
	}
}

function generateCaptures() {
	gameBoard.moveListStart[gameBoard.ply+1] = gameBoard.moveListStart[gameBoard.ply];
	
	var pieceType;
	var pieceNumber;
	var square;
	var pieceIndex;
	var piece;
	var targetSquare;
	var direction;
	
	if(gameBoard.side == COLOURS.WHITE) {
		pieceType = PIECES.wP;
		
		for(pieceNumber = 0; pieceNumber < gameBoard.pieceNumber[pieceType]; ++pieceNumber) {
			square = gameBoard.pieceList[PIECEINDEX(pieceType, pieceNumber)];				
			
			if(squareOffboard(square + 9) == BOOL.FALSE && pieceCol[gameBoard.pieces[square+9]] == COLOURS.BLACK) {
				addWhitePawnCaptureMove(square, square + 9, gameBoard.pieces[square+9]);
			}
			
			if(squareOffboard(square + 11) == BOOL.FALSE && pieceCol[gameBoard.pieces[square+11]] == COLOURS.BLACK) {
				addWhitePawnCaptureMove(square, square + 11, gameBoard.pieces[square+11]);
			}			
			
			if(gameBoard.enPassant != SQUARES.NO_SQ) {
				if(square + 9 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(square, square+9, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
				
				if(square + 11 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(square, square+11, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
			}			
			
		}			

	} else {
		pieceType = PIECES.bP;
		
		for(pieceNumber = 0; pieceNumber < gameBoard.pieceNumber[pieceType]; ++pieceNumber) {
			square = gameBoard.pieceList[PIECEINDEX(pieceType, pieceNumber)];			
			
			if(squareOffboard(square - 9) == BOOL.FALSE && pieceCol[gameBoard.pieces[square-9]] == COLOURS.WHITE) {
				addBlackPawnCaptureMove(square, square - 9, gameBoard.pieces[square-9]);
			}
			
			if(squareOffboard(square - 11) == BOOL.FALSE && pieceCol[gameBoard.pieces[square-11]] == COLOURS.WHITE) {
				addBlackPawnCaptureMove(square, square - 11, gameBoard.pieces[square-11]);
			}			
			
			if(gameBoard.enPassant != SQUARES.NO_SQ) {
				if(square - 9 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(square, square-9, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
				
				if(square - 11 == gameBoard.enPassant) {
					addEnPassantMove( MOVE(square, square-11, PIECES.EMPTY, PIECES.EMPTY, moveFlagEnPassant ) );
				}
			}
		}			
	}	
	
	pieceIndex = loopNonSlideIndex[gameBoard.side];
	piece = loopNonSlidePiece[pieceIndex++];
	
	while (piece != 0) {
		for(pieceNumber = 0; pieceNumber < gameBoard.pieceNumber[piece]; ++pieceNumber) {
			square = gameBoard.pieceList[PIECEINDEX(piece, pieceNumber)];
			
			for(index = 0; index < directionNumber[piece]; index++) {
				direction = pieceDirection[piece][index];
				targetSquare = square + direction;
				
				if(squareOffboard(targetSquare) == BOOL.TRUE) {
					continue;
				}
				
				if(gameBoard.pieces[targetSquare] != PIECES.EMPTY) {
					if(pieceCol[gameBoard.pieces[targetSquare]] != gameBoard.side) {
						addCaptureMove( MOVE(square, targetSquare, gameBoard.pieces[targetSquare], PIECES.EMPTY, 0 ));
					}
				}
			}			
		}	
		piece = loopNonSlidePiece[pieceIndex++];
	}
	
	pieceIndex = loopSlideIndex[gameBoard.side];
	piece = loopSlidePiece[pieceIndex++];
	
	while(piece != 0) {		
		for(pieceNumber = 0; pieceNumber < gameBoard.pieceNumber[piece]; ++pieceNumber) {
			square = gameBoard.pieceList[PIECEINDEX(piece, pieceNumber)];
			
			for(index = 0; index < directionNumber[piece]; index++) {
				direction = pieceDirection[piece][index];
				targetSquare = square + direction;
				
				while( squareOffboard(targetSquare) == BOOL.FALSE ) {	
				
					if(gameBoard.pieces[targetSquare] != PIECES.EMPTY) {
						if(pieceCol[gameBoard.pieces[targetSquare]] != gameBoard.side) {
							addCaptureMove( MOVE(square, targetSquare, gameBoard.pieces[targetSquare], PIECES.EMPTY, 0 ));
						}
						break;
					}
					targetSquare += direction;
				}
			}			
		}	
		piece = loopSlidePiece[pieceIndex++];
	}
}
