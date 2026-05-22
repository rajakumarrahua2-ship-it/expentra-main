import React, { useState, useEffect } from 'react';
import * as MdIcons from 'react-icons/md';

const libMap = {
  md: () => import('react-icons/md'),
  fa: () => import('react-icons/fa'),
  fa6: () => import('react-icons/fa6'),
  io: () => import('react-icons/io'),
  io5: () => import('react-icons/io5'),
  gi: () => import('react-icons/gi'),
  go: () => import('react-icons/go'),
  hi: () => import('react-icons/hi'),
  hi2: () => import('react-icons/hi2'),
  si: () => import('react-icons/si'),
  ri: () => import('react-icons/ri'),
  bi: () => import('react-icons/bi'),
  ti: () => import('react-icons/ti'),
  bs: () => import('react-icons/bs'),
  im: () => import('react-icons/im'),
  gr: () => import('react-icons/gr'),
  cg: () => import('react-icons/cg'),
  vsc: () => import('react-icons/vsc'),
  tb: () => import('react-icons/tb'),
  lu: () => import('react-icons/lu'),
  pi: () => import('react-icons/pi'),
  ai: () => import('react-icons/ai'),
  fi: () => import('react-icons/fi'),
  tfi: () => import('react-icons/tfi'),
  wi: () => import('react-icons/wi'),
  sl: () => import('react-icons/sl'),
  rx: () => import('react-icons/rx'),
  lia: () => import('react-icons/lia'),
};

const CategoryIcon = ({ iconName, className }) => {
  const [IconComponent, setIconComponent] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadIcon = async () => {
      if (!iconName) {
        if (isMounted) setIconComponent(() => MdIcons.MdCategory);
        return;
      }

      // Step 1: Detect prefix
      let prefix = '';
      if (iconName.length >= 2) {
         const p3 = iconName.substring(0, 3).toLowerCase();
         const p2 = iconName.substring(0, 2).toLowerCase();
         
         if (libMap[p3]) prefix = p3;
         else if (libMap[p2]) prefix = p2;
      }

      try {
        if (prefix && libMap[prefix]) {
          let lib = await libMap[prefix]();
          
          // SPECIAL CASE: Fa icons might be in fa or fa6
          if (prefix === 'fa' && !lib[iconName]) {
             try {
               const lib6 = await libMap['fa6']();
               if (lib6[iconName]) lib = lib6;
             } catch(e) {}
          }
          // SPECIAL CASE: Io icons might be in io or io5
          if (prefix === 'io' && !lib[iconName]) {
             try {
               const lib5 = await libMap['io5']();
               if (lib5[iconName]) lib = lib5;
             } catch(e) {}
          }
          // SPECIAL CASE: Hi icons might be in hi or hi2
          if (prefix === 'hi' && !lib[iconName]) {
             try {
               const lib2 = await libMap['hi2']();
               if (lib2[iconName]) lib = lib2;
             } catch(e) {}
          }

          if (isMounted) {
            const Final = lib[iconName] || MdIcons.MdCategory;
            setIconComponent(() => Final);
          }
        } else {
          // No prefix detected, try Md as default
          const defaultKey = iconName.startsWith('Md') ? iconName : 'Md' + iconName.charAt(0).toUpperCase() + iconName.slice(1);
          if (MdIcons[defaultKey]) {
            if (isMounted) setIconComponent(() => MdIcons[defaultKey]);
          } else {
            if (isMounted) setIconComponent(() => MdIcons.MdCategory);
          }
        }
      } catch (error) {
        console.error('Failed to load icon:', iconName, error);
        if (isMounted) setIconComponent(() => MdIcons.MdCategory);
      }
    };

    loadIcon();
    return () => { isMounted = false; };
  }, [iconName]);

  const Icon = IconComponent || MdIcons.MdCategory;

  return (
    <span className={`inline-flex items-center justify-center ${className || ''}`}>
        <Icon style={{ width: '100%', height: '100%' }} />
    </span>
  );
};

export default CategoryIcon;
