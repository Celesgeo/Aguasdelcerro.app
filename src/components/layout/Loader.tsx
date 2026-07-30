'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(!pathname.startsWith('/admin'));

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-brown"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="/images/logo.png"
              alt="Aguas del Cerro"
              width={220}
              height={220}
              priority
              className="opacity-95"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
