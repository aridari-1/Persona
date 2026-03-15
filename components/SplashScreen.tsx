"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function SplashScreen() {

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="flex flex-col items-center"
      >

        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            filter: [
              "drop-shadow(0 0 10px rgba(0,255,200,0.4))",
              "drop-shadow(0 0 30px rgba(0,255,200,0.7))",
              "drop-shadow(0 0 10px rgba(0,255,200,0.4))"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        >
          <Image
            src="/persona-logo.png"
            alt="Persona"
            width={160}
            height={160}
            priority
          />
        </motion.div>

      </motion.div>

    </div>
  );
}
