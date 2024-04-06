import { useState, useMemo, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import CustomDialog from "./components/CustomDialog";

function Game({ players, room, orientation, cleanup }) {
  const chess = useMemo(() => new Chess(), []); // <- 1
  const [fen, setFen] = useState(chess.fen()); // <- 2
  const [over, setOver] = useState("");

  const makeMove = useCallback((move) => {
    try{
        const rst = chess.move(move);
        setFen(chess.fen());

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

        return rst;
    }
    catch(e){
        return null;
    } 
  }, [chess]);

  function onDrop(source, target) {
    console.log(source, target)
    const move_data = {
        from:source,
        to:target,
        color:chess.turn(),
        promotion: "q"
    };
    console.log(chess.promotion)

    const move = makeMove(move_data);

    if(move === null) return false;
    return true;
  } // <- 3
  
  // Game component returned jsx
  return (
    <>
      <div className="board">
        <Chessboard position={fen} onPieceDrop={onDrop} />  {/**  <- 4 */}
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