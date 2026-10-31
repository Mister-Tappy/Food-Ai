import { STICKERS } from "../lib/gamification";
import { useAppStore } from "../store/useAppStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBowlFood, faBowlRice, faFireFlameCurved, faFish, faIceCream, faLeaf, faLock, faMugHot, faUtensils } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const ICONS: Record<string, IconDefinition> = { utensils: faUtensils, "bowl-rice": faBowlRice, "bowl-food": faBowlFood, "pepper-hot": faFireFlameCurved, "ice-cream": faIceCream, "mug-hot": faMugHot, fish: faFish, "fire-flame-curved": faFireFlameCurved, leaf: faLeaf };

export default function Stickers() {
  const stickerIds = useAppStore((state) => state.stickerIds);
  return <div className="flex flex-col gap-5"><div><h1 className="text-2xl font-extrabold">Sticker collection</h1><p className="text-sm text-muted">{stickerIds.length}/{STICKERS.length} unlocked from completed meals</p></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{STICKERS.map((sticker) => { const owned = stickerIds.includes(sticker.id); return <article key={sticker.id} className={`card p-5 text-center ${owned ? "" : "opacity-55"}`}><div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl ${owned ? "bg-primary-light" : "bg-subtle"}`}><FontAwesomeIcon icon={owned ? ICONS[sticker.icon] || faUtensils : faLock} /></div><h2 className="font-bold mt-3">{sticker.name}</h2><p className="text-xs text-muted mt-1">{sticker.description}</p><span className="text-[11px] font-bold uppercase text-muted mt-2 block">{owned ? "Owned" : "Locked"}</span></article>; })}</div></div>;
}
