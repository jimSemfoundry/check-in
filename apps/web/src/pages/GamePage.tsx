import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createFloatingIslandGame } from '../game/createGame';

export function GamePage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;

    const game = createFloatingIslandGame(hostRef.current);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <main ref={hostRef} className="game-page" data-testid="floating-island-game" />;
}
