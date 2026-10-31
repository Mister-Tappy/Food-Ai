import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { parseFoodIntent } from "../lib/preferenceParser";
import { DEFAULT_MEAL_PREFERENCES, useAppStore } from "../store/useAppStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faRobot } from "@fortawesome/free-solid-svg-icons";

interface Message { id: string; role: "user" | "assistant"; text: string; }

export default function FoodChat() {
  const { setMealPreferences, recommendMeal, currentMeal } = useAppStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", role: "assistant", text: "บอกได้เลยว่าอยากกินแบบไหน เช่น เผ็ดๆ ไม่เกิน 150 บาท หรืออาหารญี่ปุ่นใกล้ฉัน" }]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    const intent = parseFoodIntent(input);
    const nextPreferences = { ...DEFAULT_MEAL_PREFERENCES, ...intent.preferences, exclusions: intent.exclusions };
    setMealPreferences(nextPreferences);
    const result = recommendMeal(false);
    const response = result
      ? `${intent.summary}. My top computed match is ${result.meal.nameTh} (${result.score}%). ${result.reasons[0] || "It best fits the available preferences."}`
      : "I couldn't find an internal meal that safely satisfies every restriction. Try removing one restriction.";
    setMessages((items) => [...items, { id: `u-${Date.now()}`, role: "user", text: input }, { id: `a-${Date.now()}`, role: "assistant", text: response }]);
    setInput("");
  }

  return <div className="max-w-2xl mx-auto flex flex-col gap-4"><div><h1 className="text-2xl font-extrabold">Food assistant</h1><p className="text-sm text-muted">Local intent parser · same recommendation engine · no paid LLM</p></div><div className="card p-4 min-h-[420px] flex flex-col gap-3" aria-live="polite">{messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "bg-primary text-white self-end" : "bg-subtle self-start"}`}>{message.role === "assistant" && <FontAwesomeIcon icon={faRobot} className="mr-2" />}{message.text}</div>)}</div>{currentMeal && <Link to="/result" className="card p-3 text-sm font-bold text-primary">View {currentMeal.meal.nameTh} recommendation →</Link>}<form onSubmit={submit} className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Food request" placeholder="อยากกินอะไรเผ็ดๆ ไม่เกิน 150 บาท" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 bg-surface" /><button type="submit" className="btn btn-primary" aria-label="Send"><FontAwesomeIcon icon={faPaperPlane} /></button></form></div>;
}
