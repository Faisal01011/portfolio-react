import type { AchievementId } from '../hooks/useScore';
import { ACHIEVEMENTS } from '../hooks/useScore';

interface ScoreHUDProps {
  score: number;
  unlocked: AchievementId[];
}

export default function ScoreHUD({ score, unlocked }: ScoreHUDProps) {
  return (
    <div className="score-hud" title={`Achievements: ${unlocked.length}/${Object.keys(ACHIEVEMENTS).length}`}>
      <span className="score-label">XP</span>
      <span className="score-value">{score}</span>
      <span className="score-badges">
        {unlocked.length > 0 ? `🏆 ${unlocked.length}` : '·'}
      </span>
    </div>
  );
}
