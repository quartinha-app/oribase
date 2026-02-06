
import { Terreiro } from './types';

export const IMAGES = {
  ALTAR: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLPnahDHW2OYRxqsgWplBJdHUId1IK0VnmoMTfS5YiWBjNGilVqnKbKC-6NmzBFzIMuLw2Dz2Z1pTsv_a5qzV5aRQmOJgo8dkwiS7vtJyo2ffjpEWcDgFIoriDJmtu89a4fr-fK5r9TLg-8Oo-Y4UqszOzDBJkglw2vG06ng-b6E-m6c2ut99bGj6D2GXFjuVM5rAmDREX7M9qv3bFGU-fmN_18R0KqT2MKBKr7HUTeMyvcaswI3-Da6wUFHh1OKijeVNAbRTJPeU",
  SELO: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfW0B4Z56rv-qqMXoMB1z7yTxYr8aH-2D3cxHBpCDO6QnT6fYRWDak7gShVodXaRZrGgjkW9TrdO8n5lrPtgWhX_D3x8bdO2Iw_PWGwcjiq9ZHdlYPTo4DmCJxZ-SxNId09mN-Z0gzM4qryKU4W0RABovUjdqpZ_2XxzW3RM5T1OpkFRxfhN5ywWsxqE9QExrxokyQqlWXXwO13LwEW8vDv3Zh8kFNFvKlVRz9iV6LdudbcMxDBjX9Ff3jD6GH-YzF6wQM0QrTgQo",
  AVATAR_FEMALE: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYhRkqNkNDR16NhNefY0OshKLcw5J3qyFfHqIGK6eLdmFGl-8NLroV2jDiSIQAC_u1DqAyIwkJpkYE-yA3mFOduHrLbBTsSBEpqCsBItE9nhX2x9n8AIxdGz9D5ysFCBhPCGZX0IazcOTpwqmxIx5vcidp8rmgQla59PnPRuA7WY2C8rvF4zPr_vc5Tfsuewx4yHDHV5aPa85JvF5yBginymlLiJT9YfLZ3fJIBNn2tOWkrwll6ZHBIPOD1BeUS4HnjWd4C7LTWUI",
  AVATAR_MALE: "https://lh3.googleusercontent.com/aida-public/AB6AXuBriSjQVDp7q3uz2PBRsM76nSGEvduUzRQGxNyDGsFS53EOsHVVHUFAqplupzb7fcRg8JepB2nTUuWzcutb9idwrevJ6wZh81bLQkr2odHcyFatGG91z8VAfsgzUT0bJhbdmG-H8vrRqQeyHwDjZk-qMTQyxSKtUIK1dESkHuNx152Fu93V3TynGycj_uY0WGzxq71X0KNmzoCswYdHVnPC99gZ4eWlrL_uehtpr73oqQ__AN4dkgi_AqN9vbMd0FYzCNdUpOCMbVg",
  LOGOS: {
    UFRB: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHgprziGz0oCWwmhdvM1whaAo60j8I6cBVGnjPfI9ehZzjxY8N55Wr206Q2shygqwi1QDRxzYX-3aLq81G9m2p3BiyvP7TfDvCxmQx4F4b-PYbAAxK2dos1EbwlBqIgYjRIq4R0WbAMJ5Y1te80hKmkcwww-vP8lM0Nlm24e2lMLG19CsqpdycaKVZNK3tn8mdJy8rei24cJRqLd2mpMRb8w5XCQI--GTgDg--TrhPCSQWzOtKojQRAG483jcwnnV7rRqnre_eS60",
    INSTITUTO: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgSXU9d87nqMhBgDZ-mCcUYgnjvsLE29PDQ97cqidDPy-3L_TjhAEbh53DxYiR1vgpK_WxIPlZ2Cukmsfin4PRXk58RMJ6CS0G0JOzK-1aU9fTDjiH4WBcJNug48QiyawJjhjTVCEXCO2MXx-Q_P7q6WJKIRoS1DJCwEqLruwVzpEdmsczba92Q2NBpUYDnEiWkGipujXFHETAv2zd-RkLBvFjuRYZDQRHZPB4mpI_sCg4dPvO3OVNPoOTMNjk1dxiRzQWXzJAygc",
    HERITAGE: "https://lh3.googleusercontent.com/aida-public/AB6AXuDX52OOGijB128XgkCPfll4i4ce9kh5LUmyUbIxk6D36Fp-Z68gG3eneA9v4dWFa1jN6qx-otLfhcbIAfM1GjigkIuxVnVVPUbGoBy2AkWKw0cB6Xrs_a5VXdFyBLmO7UeF85oMFmBewFNJAg8P3XZjPQJ0IrWmIC9LJlZymJt7HJoV7oP2NZmgIOovxNhHr96qw01O5Kw0gUGlBaFHqEF1jH1xb4glHS1I3Od0lVF3Qwq6yImx8RVjZ5W7i91Z1dYw0dLrAgPWn3A"
  }
};

// Fix: Import Terreiro from ./types instead of defining it implicitly
// Fix: Import Terreiro from ./types instead of defining it implicitly
export const MOCK_TERREIROS: Terreiro[] = [
  {
    id: '1',
    owner_id: 'mock-owner-1',
    name: 'Ilê Axé Oxumaré',
    address: 'Vasco da Gama',
    city: 'Salvador',
    state: 'BA',
    description: 'Tradição Ketu.',
    verification_status: 'verified',
    latitude: -12.997237,
    longitude: -38.494747,
    image: IMAGES.ALTAR,
    is_visible: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    owner_id: 'mock-owner-2',
    name: 'Terreiro Mokambo',
    address: 'Trobogy',
    city: 'Salvador',
    state: 'BA',
    description: 'Tradição Angola.',
    verification_status: 'pending',
    latitude: -12.929845,
    longitude: -38.407983,
    image: IMAGES.ALTAR,
    is_visible: false,
    created_at: new Date().toISOString()
  }
];

export const STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];