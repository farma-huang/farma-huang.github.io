import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface BentoGridProps {
    children: React.ReactNode;
    className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            className={clsx(
                "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto p-4 pt-24",
                className
            )}
        >
            {children}
        </motion.div>
    );
};

interface BentoItemProps {
    children: React.ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3 | 4;
    rowSpan?: 1 | 2;
}

export const BentoItem: React.FC<BentoItemProps> = ({
    children,
    className,
    colSpan = 1,
    rowSpan = 1
}) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={clsx(
                "bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden relative group hover:border-zinc-700 transition-colors",

                // Column Spans
                colSpan === 1 && "col-span-1",
                colSpan === 2 && "col-span-1 md:col-span-2",
                colSpan === 3 && "col-span-1 md:col-span-3",
                colSpan === 4 && "col-span-1 md:col-span-4", // Full width

                // Row Spans
                rowSpan === 1 && "row-span-1",
                rowSpan === 2 && "row-span-1 md:row-span-2",

                className
            )}
        >
            {children}
        </motion.div>
    );
};
