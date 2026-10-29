import {
  MdEco,
  MdSpa,
  MdLocalFlorist,
  MdPark,
  MdWhatshot,
  MdBolt,
  MdStarOutline,
  MdStarHalf,
  MdStar,
  MdEmojiEvents,
} from 'react-icons/md';
import { uiText } from 'lib/translations';
import { HABIT_MILESTONES } from './habitStore';

const ICONS = [
  MdEco,
  MdSpa,
  MdLocalFlorist,
  MdPark,
  MdWhatshot,
  MdBolt,
  MdStarOutline,
  MdStarHalf,
  MdStar,
  MdEmojiEvents,
];

export default function HabitBadge({ days, earned = true }) {
  const Icon = ICONS[HABIT_MILESTONES.indexOf(days)];
  if (!Icon) return null;
  const label = uiText(earned ? 'habits_badge_earned' : 'habits_badge_locked', { days });
  return (
    <span
      className={`habitBadge${earned ? ' isEarned' : ''}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}
