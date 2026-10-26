import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo } from 'react';
import variables from 'config/variables';
import { MdClose, MdEmail, MdContentCopy } from 'react-icons/md';
import { FaFacebookF } from 'react-icons/fa';
import { AiFillWechat } from 'react-icons/ai';
import { SiTencentqq, SiX } from 'react-icons/si';
import Tooltip from '../Tooltip/Tooltip';
import { toast } from 'react-toastify';

import { Button } from 'components/Elements';

import './sharemodal.scss';

function ShareModal({ modalClose, data }) {
  useTranslationVersion();
  if (data.startsWith('https://cdn.')) {
    data = {
      url: data,
      name: 'this image',
    };
  } else if (data.startsWith('"')) {
    data = {
      url: data,
      name: 'this quote',
    };
  } else {
    data = {
      url: data,
      name: 'this marketplace item',
    };
  }

  const copyLink = () => {
    navigator.clipboard.writeText(data.url);
    toast(
      data.url.startsWith('"')
        ? variables.getMessage('toasts.quote')
        : variables.getMessage('toasts.link_copied'),
    );
  };

  return (
    <div className="smallModal">
      <div className="shareHeader">
        <span className="title">{variables.getMessage('widgets.quote.share')}</span>
        <Tooltip title={variables.getMessage('modals.welcome.buttons.close')}>
          <div className="close" onClick={modalClose}>
            <MdClose />
          </div>
        </Tooltip>
      </div>
      <div className="shareButtons">
        <Button
          onClick={() =>
            window
              .open(`https://x.com/intent/tweet?text=${encodeURIComponent(data.url)}`, '_blank')
              ?.focus()
          }
          icon={<SiX />}
          tooltipTitle="X (Twitter)"
          type="icon"
        />
        <Button
          onClick={() =>
            window
              .open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
                '_blank',
              )
              ?.focus()
          }
          icon={<FaFacebookF />}
          tooltipTitle="Facebook"
          type="icon"
        />
        <Button
          onClick={() =>
            window
              .open(
                `mailto:?subject=${encodeURIComponent('Shared from Moo')}&body=${encodeURIComponent(data.url)}`,
                '_blank',
              )
              ?.focus()
          }
          icon={<MdEmail />}
          tooltipTitle="Email"
          type="icon"
        />
        <Button
          onClick={() =>
            window
              .open(
                `https://api.qrserver.com/v1/create-qr-code/?size=154x154&data=${encodeURIComponent(data.url)}`,
                '_blank',
              )
              ?.focus()
          }
          icon={<AiFillWechat />}
          tooltipTitle="WeChat"
          type="icon"
        />
        <Button
          onClick={() =>
            window
              .open(
                `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(data.url)}`,
                '_blank',
              )
              ?.focus()
          }
          icon={<SiTencentqq />}
          tooltipTitle="Tencent QQ"
          type="icon"
        />
      </div>
      <div className="copy">
        <input
          type="text"
          value={data.url}
          className="left field"
          readOnly
          aria-label={uiText('link_to_share_ed943d')}
        />
        <Button
          onClick={() => copyLink()}
          icon={<MdContentCopy />}
          tooltipTitle={variables.getMessage('modals.share.copy_link')}
          type="icon"
        />
      </div>
    </div>
  );
}

const MemoizedSharemodal = memo(ShareModal);

export { MemoizedSharemodal as default, MemoizedSharemodal as ShareModal };
