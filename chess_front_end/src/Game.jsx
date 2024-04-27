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

  useEffect(()=> {
    fetchModel();

  }, []);

  const fetchModel = async () =>{
    try{
      const gameBoard = chess.board();
      const castlingRights = {
        player: chess.getCastlingRights("w"),
        model: chess.getCastlingRights("b")
      }
      const body = {
        gameBoard,
        castlingRights,
        modelTime
      }
      const response = await fetch("/whatever/the/endpoint/is", {
        method: 'POST',
        body
      })
      const data = await response.json();
      setModelTime(data.updatedModelTime)
      onDrop(data.source, data.target, data.piece)
    }
    catch (error){
      console.error("Failed to get move from model: ", error)
    }
  }

  useEffect(() => {
    const timer = setInterval(() =>{
      if(chess.isGameOver()){
        clearInterval(timer);
      }
      else{
        setPlayerTime(prevTime => ({
          ...prevTime,
          [currentTurn] : prevTime[currentTurn] - 1
        }));
      }
    }, 1000);
    return ()=>clearInterval(timer);
  },[currentTurn, chess]);

  const makeMove = useCallback((move) => {
    try{
      console.log(move)
        const rst = chess.move(move);
        setFen(chess.fen());
        setCurrentTurn(chess.turn())
        if(playerTime.w <=0){
          setEndByTime({w:true, m:false})
        }
        else if(modelTime.model <=0){
          setEndByTime({w:false,m:true})
        }

        console.log("ov, cm", chess.isGameOver(), chess.isCheckmate());
        if(chess.isGameOver()){
            if(chess.isCheckmate()){
                setOver(
                    `Checkmate! ${chess.turn() === "w" ? "Black" : "White"} wins!`
                  ); 
            }
            else if(chess.isDraw()){
                setOver("Draw");
            }
            else{
                setOver("Game over");
            }
        }
        else if(endByTime.w || endByTime.m){
          if(endByTime.w){
            setOver(
              'Black won by time!'
            );
          }
          else if(endByTime.m){
            setOver(
              'White won by time!'
            )
          }
        }

        return rst;
    }
    catch(e){
        return null;
    } 
  }, [chess]);

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

    console.log(chess.board())
    console.log(move)
    console.log(chess.moves({verbose: true}))
    console.log(chess.getCastlingRights("w"))

    if(move === null) return false;
    return true;
  } // <- 3
  
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