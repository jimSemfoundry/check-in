import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPet, getPetAsset, petAction, renamePet } from '../features/pet/api';
export function PetPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['pet'], queryFn: getPet });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['pet'] });
    void client.invalidateQueries({ queryKey: ['today'] });
  };
  const action = useMutation({ mutationFn: petAction, onSuccess: refresh });
  const rename = useMutation({ mutationFn: renamePet, onSuccess: refresh });
  const pet = query.data;
  if (!pet) return <section className="page state">正在迎接宠物…</section>;
  const progress = pet.nextLevelExperience
    ? Math.min(100, (pet.experience / pet.nextLevelExperience) * 100)
    : 100;
  return (
    <section className="page pet-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">一起陪伴它长大</span>
          <h1>宠物中心</h1>
        </div>
        <button
          className="icon-button"
          aria-label="修改宠物名字"
          onClick={() => {
            const name = prompt('新的名字', pet.name);
            if (name && name !== pet.name) rename.mutate(name);
          }}
        >
          <span className="material-symbols-rounded">edit</span>
        </button>
      </div>
      <div className="pet-stage">
        <img
          src={getPetAsset(pet.species.code, pet.growthStage, 'happy')}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          alt={`${pet.name}，${pet.species.name}`}
        />
        <span className="pet-fallback material-symbols-rounded">pets</span>
        <h2>{pet.name}</h2>
        <p>
          Lv. {pet.level} · {pet.species.name}
        </p>
      </div>
      <div className="pet-stats">
        <label>
          经验{' '}
          <span>
            {pet.experience}/{pet.nextLevelExperience ?? 'MAX'}
          </span>
          <i>
            <b style={{ width: `${progress}%` }} />
          </i>
        </label>
        <label>
          亲密度 <span>{pet.intimacy}</span>
          <i>
            <b style={{ width: `${Math.min(100, pet.intimacy)}%` }} />
          </i>
        </label>
        <p>
          <span className="material-symbols-rounded">nutrition</span>
          {pet.foodBalance} 份食物
        </p>
      </div>
      <div className="pet-actions">
        <button
          disabled={
            !pet.actions.feed.available ||
            pet.foodBalance < 1 ||
            action.isPending ||
            !navigator.onLine
          }
          onClick={() => action.mutate('feed')}
        >
          <span className="material-symbols-rounded">restaurant</span>喂食
        </button>
        <button
          disabled={!pet.actions.play.available || action.isPending || !navigator.onLine}
          onClick={() => action.mutate('play')}
        >
          <span className="material-symbols-rounded">toys</span>玩耍
        </button>
      </div>
      {!pet.actions.play.available && (
        <p className="hint">
          {pet.actions.play.reason}，约 {pet.actions.play.cooldownRemainingSeconds} 秒后可玩耍
        </p>
      )}
    </section>
  );
}
