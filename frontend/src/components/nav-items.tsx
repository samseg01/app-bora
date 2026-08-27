import type { SVGProps } from "react";

/** Os 4 destinos e seus ícones, do design. Fonte única para a nav das duas visualizações. */

type IconeProps = SVGProps<SVGSVGElement>;

const base: IconeProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
};

export const NAV = [
  {
    href: "/",
    label: "Descobrir",
    Icone: (p: IconeProps) => (
      <svg {...base} {...p}>
        <path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z" />
      </svg>
    ),
  },
  {
    href: "/mapa",
    label: "Mapa",
    Icone: (p: IconeProps) => (
      <svg {...base} {...p}>
        <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
      </svg>
    ),
  },
  {
    href: "/conexoes",
    label: "Conexões",
    Icone: (p: IconeProps) => (
      <svg {...base} {...p}>
        <circle cx="9" cy="8" r="3.4" />
        <path d="M3 20c0-3.4 2.7-5.2 6-5.2s6 1.8 6 5.2" />
        <path d="M16.5 6.2a3.4 3.4 0 010 6.4" />
        <path d="M18.4 14.6c2 .7 3.6 2.3 3.6 5" />
      </svg>
    ),
  },
  {
    href: "/salvos",
    label: "Salvos",
    Icone: (p: IconeProps) => (
      <svg {...base} {...p}>
        <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Perfil",
    Icone: (p: IconeProps) => (
      <svg {...base} {...p}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
] as const;
