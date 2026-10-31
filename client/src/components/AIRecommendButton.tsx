import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

interface Props {
  onClick: () => void;
  loading?: boolean;
}

export default function AIRecommendButton({ onClick, loading }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="btn btn-primary w-full bg-gradient-to-br from-primary to-[#4F8CFF] disabled:opacity-70"
    >
      {loading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
          />
          Thinking...
        </>
      ) : (
        <>
          <FontAwesomeIcon icon={faWandMagicSparkles} />
          Get AI Recommendation
        </>
      )}
    </motion.button>
  );
}
