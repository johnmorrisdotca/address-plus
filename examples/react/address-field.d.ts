import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "address-field": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { country?: string; label?: string; name?: string; value?: string; lang?: string; theme?: string; size?: string; required?: boolean; disabled?: boolean; readonly?: boolean; validate?: boolean };
    }
  }
}
