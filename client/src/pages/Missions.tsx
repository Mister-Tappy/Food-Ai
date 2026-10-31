import { useAppStore } from "../store/useAppStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCoins } from "@fortawesome/free-solid-svg-icons";

export default function Missions() {
  const { missions, coins, claimMission } = useAppStore();
  return <div className="max-w-2xl mx-auto flex flex-col gap-5"><div className="flex justify-between gap-3"><div><h1 className="text-2xl font-extrabold">Daily missions</h1><p className="text-sm text-muted">Resets using your local date</p></div><span className="badge bg-primary-light text-primary-dark h-fit"><FontAwesomeIcon icon={faCoins} className="mr-1" />{coins}</span></div>{missions.map((mission) => <article key={mission.id} className="card p-4"><div className="flex justify-between gap-3"><div><h2 className="font-bold">{mission.title}</h2><p className="text-xs text-muted">{mission.description}</p></div><span className="text-sm font-bold text-primary">+{mission.coinReward}</span></div><div className="h-2 bg-subtle rounded-full mt-4 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${mission.progress / mission.target * 100}%` }} /></div><div className="flex items-center justify-between mt-2"><span className="text-xs text-muted">{mission.progress}/{mission.target} · {mission.status.replace("_", " ")}</span>{mission.status === "completed" && <button type="button" onClick={() => claimMission(mission.id)} className="btn btn-primary text-xs py-1.5"><FontAwesomeIcon icon={faCheck} />Claim</button>}</div></article>)}</div>;
}
