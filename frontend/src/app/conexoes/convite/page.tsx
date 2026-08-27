import { Desktop, Mobile } from "@/components/viewport";
import { ConviteDesktop } from "@/views/desktop/convite";
import { ConviteMobile } from "@/views/mobile/convite";

/** Convite por link. Ver `docs/front-end-ideias/conexoes/Convite.dc.html`. */
export default function ConvitePage() {
  return (
    <>
      <Mobile>
        <ConviteMobile />
      </Mobile>
      <Desktop>
        <ConviteDesktop />
      </Desktop>
    </>
  );
}
