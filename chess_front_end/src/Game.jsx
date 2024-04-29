import { useState, useMemo, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import CustomDialog from "./components/CustomDialog";

function Game({ players, room, orientation, cleanup }) {
  const chess = useMemo(() => new Chess(), []); // <- 1
  const [fen, setFen] = useState(chess.fen()); // <- 2
  const [over, setOver] = useState("");
  const [playerTime, setPlayerTime] = useState({
    w: 600
  })
  const [modelTime, setModelTime] = useState({
    model:600
  })
  const [currentTurn, setCurrentTurn] = useState("w");
  const [endByTime, setEndByTime] = useState({
    w: false,
    m: false
  })

  const [previousMoves, setPreviousMoves] = useState([])

  useEffect(()=> {
    const fetchModel = async () =>{
      console.log(previousMoves)
      if(currentTurn === 'b'){
        try{
          const gameState = {
            previousMoveTwo:previousMoves.length > 1? previousMoves[0]: null,
            previousMove:previousMoves.length > 1? previousMoves[1]: previousMoves[0],
            pgn:chess.pgn()
          };
          const castlingRights = {
            player: chess.getCastlingRights("w"),
            model: chess.getCastlingRights("b")
          }
          const modelMeta = [modelTime.model, 0, castlingRights.player.q, castlingRights.player.k, castlingRights.model.q, castlingRights.model.k]
    
          const body = {
            gameState,
            modelMeta
          }

          console.log(body)
          const response = await fetch("/whatever/the/endpoint/is", {
            method: 'POST',
            body
          })
          const data = await response.json();
          /*setModelTime(prevModelTime => ({
            model: Math.max(0, prevModelTime.model - data.timeTaken) // Ensures time doesn't go negative
          }));*/
          setModelTime({
            model: data.remainingTime  // Assuming 'remainingTime' is the field with the remaining time
          });
          onDrop(data.source, data.target, data.piece)
        }
        catch (error){
          console.error("Failed to get move from model: ", error)
        }
      }
  
    }
    fetchModel();

  }, [currentTurn, chess, modelTime, previousMoves]);

  

  useEffect(() => {
    const timer = setInterval(() =>{
      if(chess.isGameOver() ){
        clearInterval(timer);
      }
      else{
        if(currentTurn === 'b'){
          console.log("hi i update somewhere else")
        }
        else{
        setPlayerTime(prevTime => ({
          ...prevTime,
          [currentTurn] : (prevTime[currentTurn] > 0)? prevTime[currentTurn] - 1: 0
        }));
      }
    }
    }, 1000);
    return ()=>clearInterval(timer);
  },[currentTurn, chess, playerTime, modelTime]);

  useEffect(() => {
    if (playerTime.w <= 0 || modelTime.model <= 0) {
      setEndByTime({
        w: playerTime.w <= 0,
        m: modelTime.model <= 0
      });
    }
  }, [playerTime, modelTime]);

  const makeMove = useCallback((move) => {
    try{
        const rst = chess.move(move);
        setFen(chess.fen());
        setCurrentTurn(chess.turn())
        console.log(endByTime)
        console.log("ov, cm", chess.isGameOver(), chess.isCheckmate());
        if(chess.isGameOver() || (endByTime.m || endByTime.w)){
            if(chess.isCheckmate()){
                setOver(
                    `Checkmate! ${chess.turn() === "w" ? "Black" : "White"} wins!`
                  ); 
            }
            else if(chess.isDraw()){
                setOver("Draw");
            }
            else{
                setOver("Game over: " + ((endByTime.w)?"Black ": "White") + " wins by Time");
            }
        }
        return rst;
    }
    catch(e){
        return null;
    } 
  }, [chess, endByTime]);

  function onDrop(source, target, piece) {
    //console.log(source, target)
    const move_data = {
        from:source,
        to:target,
        color:chess.turn(),
        promotion: piece.substring(1, 2).toLowerCase()
    };
    console.log(move_data.color, move_data.promotion)

    const move = makeMove(move_data);

    console.log(move)
    console.log(chess.pgn())
    console.log(chess )
    console.log(chess.getCastlingRights("w"))
    if(move === null) return false;

    setPreviousMoves((prevMoves) => {
      if(prevMoves.length >= 2){
        const newMoves = prevMoves.concat({
          from: move.from,
          to:move.to,
          piece: move.piece,
          promotion: (move.flags.search('p') !== -1)? move.promotion : "none",
          color: (move.color == 'w')
        })
        return newMoves.slice(-2)
      }
      else{
        return prevMoves.concat({
          from: move.from,
          to:move.to,
          piece: move.piece,
          promotion: (move.flags.search('p') !== -1)? move.promotion : "none",
          color: (move.color == 'w')
        })
      }
      
    })
    console.log(previousMoves)
    return true;
  } 
  
  // Game component returned jsx
  return (
    <>
      <div className="board">
        <Chessboard position={fen} onPieceDrop={onDrop} /> 
        <div className="timer">
          White Time: {playerTime.w}s
        </div>
        <div className="timer">
        Black Time: {modelTime.model}s
        </div>
      </div>
      <CustomDialog // <- 5
        open={Boolean(over)}
        title={over}
        contentText={over}
        handleContinue={() => {
          setOver("");
        }}
      />
    </>
  );
}

export default Game;