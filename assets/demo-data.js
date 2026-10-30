/* Demo catalogue used ONLY when Supabase is not configured (local preview without
   assets/config.js values). Once Supabase is configured the website reads products
   from the database and this file is ignored. Also the source for supabase/seed.sql
   (run `npm run seed:generate` to regenerate it). All names, prices and photos are
   placeholders. */
(function () {
  // Photos already used on the homepage (reused so no new assets are needed).
  var IMG = {
    shirtChinos: "https://lh3.googleusercontent.com/aida/AEtjO1UDRuMzjyoaFH8IDA89bbBtD2TcyqrkmiX_OdBMfaG3JDZ0bxRMlNWZb0QUgNU1gFhdFZ_b9vtJ9o95wEwe_D1CW_LKNzPFFXA5pydSFQE3ttbNG0_dRH9-3rB3kZti4duZ8zARWvr1fx_ltuGh0CaDQyqtudGocaRCoMRNF312d9xg3xM3PTrdLKkSA4UHNjVdaNKyoFHk4Q7ENIoJrpocyrGOiZDt7tzX-6xDbmqk",
    menCasual:   "https://lh3.googleusercontent.com/aida-public/AB6AXuBa92OKgMNmZz8-inPz3QvWqunmSnfFQxJzfFV1WsRa-cXhiXeiV7TjA-zZrxrILTMSAwo1OUn70eyw4shesqZ5GU9wHPwcCicfI7xEjMc_yysw2UcymUYO-VH2Wm_SI61-6Y0zzQIMLSP96sDht8RU1vaiWMkYAT6hp2U4nACrUGcBfjMh2IlTSjyZBFdDTg4Td4yuKXn1NGqoceWOcLQyC_luGCBzz6Ba7RF_Ilk",
    kurti:       "https://lh3.googleusercontent.com/aida-public/AB6AXuBRO7khwLAbiy74nuU2Q-QDi2FMPzJzIC2P1Vw5dk0KMAN9MVbf_y06mCeAMivkP-6luETluwDlVcrUp1tIxKTeHar9VWMr5VyO9nJ2CCuL7HYAup6Lc1txzcJm7mrXLfTBXdUzG8N7yEdLfLW00M127jc0c8c5Tj6zjoMdqgY7HndnpAehs6n_ckL3crB9ffVYWgqCoipayPfoxS4b-SANEyda1XQjGkbZqE0QRtc",
    kurtiJeans:  "https://lh3.googleusercontent.com/aida/AEtjO1XyoZJEnqtIq5ZVoCm7yT3iiMWSWzkNmhydcCYjYz1V_VfpwiVtg6OV3_fjcE62SDksDeZwTflRcV2S42hhKXahJDdme9_ivcdBUu8XtZpFXRboM6xFSD1rUnQYFzIvUQ2GSAMnPU2yCGHvABexazOtmYVUuySmD_IghOPc_3fN-EKkZKRab7NTZMxTIUIOBesYQVr8XligChJtxYs8xoUx1ODe8HvuhlSJVcPgqa_4",
    kids:        "https://lh3.googleusercontent.com/aida-public/AB6AXuAenS_EU2Da6we06lOh6hwFDfqyFJ8sAzfCkk7Gql08hkVpOCz6Ui4TcVkgWp-TT2r19aNOhq4Ixci8fhmg4eENrrsxOua4ocz2I8hptwkhHCEbQC-Znvz8ohktSckwVTFEsuWe04OriIX_fxAe6SeK-vbkc9zJ2hikxtI-trwFvhfwlwedu_k6e2PRoMZIqo5eBn1heT9jE97sspi1TbyZIdx-pdu7J3TEaRSjagM",
    kidsSet:     "https://lh3.googleusercontent.com/aida/AEtjO1WI1aLiQtgXhrAA_rxdkEG6B4-pqLYh4mup6VaxyMHX36WUrxYPMDjjojxK1fU0_S1n3vOPJQBP6MyvWm3MHp_L_xU85d4HMY6w9rDfReD6Jt0gSsDNI6EVKrNEvLzkC7Nnkn3JCks3E3poh5cZ0k-TaTP4sGdEZrLD8bExeBq5-UNd9mCJriSZbpjC7Q6hs36tHci6r0YXSGsDHvkotrqbSjkNBRsmopZOeAtprptK",
    ethnic:      "https://lh3.googleusercontent.com/aida-public/AB6AXuB94fLFDGja51WGddlsMDDI1ZCpaNPQ1KlUQ67hrURMTABd1OaN-08Zfyuw6RxOfSl7BV34FEuzXaCwsMOjfY_aJaikqPIQKqzzE4_do29tV1QdePuiotyrzviF8G4HkcTpRCQA_wHD2-cO7f4gb-3Hx1Ab3dcUNmrlIZGhy5r3OtT0n5i59NO1kyc7I9V5MAYjjvYN0MZsJ9JyuK_z_iXYXJegMkGc3tHPYrcibX0",
    saree:       "https://lh3.googleusercontent.com/aida-public/AB6AXuCp-DmH9LoO2MA4FggZndtP3xNQKb64DEfxAKj06E_sKYL6lPbWXv_2HMpbY73dVe8ontGR3SxKbMA-3-SGIgfC1MnwBwU4Ihn87OnFeL5B0a3EbdpeyzoTbT48-Isi50bC2gGJpWeebnjSVgH_xSEuLDFFCJsAf-3tk9nFj3FDMJRDcO9N3GufV1RkFQhHaLuHxi5CFW0EH3VCNenl1LNym63uYd80lfXdzHFBzJM",
    winter:      "https://lh3.googleusercontent.com/aida-public/AB6AXuA34TuHgfsHqk_0pDlDbFjAXA8N3qtTqcKGb-rZdFXIpg8I9Y2eBhO2CgGOptxYvngJMJSFIY0K6MxjhBH9wVavtJNMZMKs4DOpEENbmFi2nGVQD7ENhB4JvIWgWMVfS3fzYSpEnhMBxMFK7ir2zKFyIaNxnt2jAeH82wdCBOzHj-nymiKx16QFhyn_3jqg7j820UkApLBK_EeJUTtDo8v_4NCacjlygzfQhth3U0E",
    bomber:      "https://lh3.googleusercontent.com/aida/AEtjO1WJXftKiSMUNdTm54IzO5FySCRgpufzhUvTzEW2N7WF1Cb0-e65Uyw5xdDlldvNxZQI1ygPVw-f-Nsk0IAZFPqDavYkmwXzEagzH2YYf8EB3pyFfVcxnsO0GSpzpOVLJm-hDu0Len6HkyiOJK3vn5sxrwHvOO3RNsG3V7WTpFJYYhTZ1WrPRpnTTBmad5-7FNu-RnZkI-AaMcqZLWDasO8SioB6srFUQCZLGY_fz7da",
    tees:        "https://lh3.googleusercontent.com/aida-public/AB6AXuDd9xr4DQ8ftjGOJUGEy4fYWVKoIT1PmK8esXcJreMeVPwe0fZIRZJHF43glKVBmqAEkCTeNPvT2_RALd6w8yLWw2wJfXhTOeG3uIaiunvzSusJTA1tKYfJ_J8rL-FjeOoPmCP4xL31PQ6BZHgO_yBdEnxwCyMxb7h3T52JJ1lmOyp6-v0sqlJcJiEgIcyhWja8fGcUq6MetNmR8L6KmmHX-eMb5oFQR4uABA8Xmp8"
  };

  var CATEGORIES = [
    { id: 'men',    label: "Men's Wear",   subs: ['Shirts', 'T-shirts', 'Jeans', 'Trousers', 'Casual Wear', 'Formal Wear'] },
    { id: 'women',  label: "Women's Wear", subs: ['Kurtis', 'Tops', 'Dresses', 'Jeans', 'Sarees', 'Suits'] },
    { id: 'kids',   label: "Kids' Wear",   subs: ['T-shirts', 'Casual Outfits', 'Frocks', 'Festive Clothing'] },
    { id: 'ethnic', label: 'Ethnic Wear',  subs: ['Kurtas', 'Sherwanis', 'Sarees', 'Lehengas', 'Traditional Suits'] },
    { id: 'winter', label: 'Winter Wear',  subs: ['Sweaters', 'Hoodies', 'Sweatshirts', 'Jackets'] }
  ];

  // image: null => placeholder (no matching homepage photo available yet)
  var PRODUCTS = [
    // ---- Men's Wear ----
    { id: 'men-001', name: 'Olive Slim-Fit Linen Shirt',   category: 'men', sub: 'Shirts',      price: 1450, image: IMG.menCasual,    badge: 'New Arrival', added: '2026-10-20', description: 'A breathable linen-blend shirt with a clean slim fit, easy to wear from market days to family dinners.' },
    { id: 'men-002', name: 'Checked Cotton Casual Shirt',  category: 'men', sub: 'Shirts',      price: 899,  image: null,             added: '2026-09-02', description: 'Soft cotton shirt with a small check pattern and a comfortable regular fit.' },
    { id: 'men-003', name: 'Classic Crew-Neck T-shirt',    category: 'men', sub: 'T-shirts',    price: 499,  image: IMG.tees,         badge: 'Bestseller',  added: '2026-08-15', description: 'An everyday cotton tee with a soft hand-feel. Pairs with jeans or chinos.' },
    { id: 'men-004', name: 'Straight-Fit Blue Denim Jeans',category: 'men', sub: 'Jeans',       price: 1499, image: null,             added: '2026-09-18', description: 'Mid-rise straight-fit denim in a classic mid-blue wash with a little stretch for comfort.' },
    { id: 'men-005', name: 'Beige Cotton Chinos',          category: 'men', sub: 'Trousers',    price: 1299, image: null,             added: '2026-10-05', description: 'Smart tapered chinos in a versatile beige shade, suited to both casual and semi-formal looks.' },
    { id: 'men-006', name: 'Linen Shirt & Chinos Combo',   category: 'men', sub: 'Casual Wear', price: 1299, image: IMG.shirtChinos,  badge: 'Bestseller',  added: '2026-10-12', description: 'A coordinated linen shirt and chinos pairing for relaxed, polished everyday style.' },
    { id: 'men-007', name: 'Charcoal Formal Trousers',     category: 'men', sub: 'Formal Wear', price: 1399, image: null,             added: '2026-07-22', description: 'Flat-front formal trousers in charcoal with a clean drape for office and occasions.' },
    { id: 'men-008', name: 'White Formal Office Shirt',    category: 'men', sub: 'Formal Wear', price: 999,  image: null,             badge: 'New Arrival', added: '2026-10-25', description: 'Crisp full-sleeve formal shirt with a sharp collar, ideal for work and interviews.' },

    // ---- Women's Wear ----
    { id: 'women-001', name: 'Printed Cotton Everyday Kurti',  category: 'women', sub: 'Kurtis',  price: 999,  image: IMG.kurtiJeans, badge: 'Bestseller',  added: '2026-09-28', description: 'Light cotton kurti with a pretty print, made for comfortable all-day wear.' },
    { id: 'women-002', name: 'Handblock Print Cotton Kurti',   category: 'women', sub: 'Kurtis',  price: 1099, image: IMG.kurti,      badge: 'New Arrival', added: '2026-10-22', description: 'Straight-cut kurti with a handblock-style print and a soft, breathable feel.' },
    { id: 'women-003', name: 'Pastel Ruffle Sleeve Top',       category: 'women', sub: 'Tops',    price: 699,  image: null,           added: '2026-08-30', description: 'A relaxed western top with gentle ruffle sleeves in a soft pastel tone.' },
    { id: 'women-004', name: 'Floral Midi Summer Dress',       category: 'women', sub: 'Dresses', price: 1599, image: null,           badge: 'New Arrival', added: '2026-10-18', description: 'Flowy midi dress with a floral print and a flattering waist.' },
    { id: 'women-005', name: 'High-Rise Skinny Jeans',         category: 'women', sub: 'Jeans',   price: 1399, image: null,           added: '2026-09-10', description: 'High-rise stretch denim designed to sit comfortably through the day.' },
    { id: 'women-006', name: 'Soft Cotton Printed Saree',      category: 'women', sub: 'Sarees',  price: 1799, image: null,           added: '2026-08-05', description: 'Lightweight cotton saree with a subtle printed border, easy to drape for daily or festive wear.' },
    { id: 'women-007', name: 'Embroidered Salwar Suit Set',    category: 'women', sub: 'Suits',   price: 2299, image: null,           badge: 'Bestseller',  added: '2026-09-22', description: 'Three-piece suit set with neat embroidery on the neckline and a matching dupatta.' },
    { id: 'women-008', name: 'Straight Cotton Kurti with Pants',category: 'women', sub: 'Suits',  price: 1699, image: null,           added: '2026-07-30', description: 'Coordinated kurti and pants set in a comfortable cotton blend.' },

    // ---- Kids' Wear ----
    { id: 'kids-001', name: 'Graphic Print Kids T-shirt',    category: 'kids', sub: 'T-shirts',         price: 399,  image: null,        added: '2026-09-05', description: 'Soft, easy-care cotton tee with a fun graphic print for everyday play.' },
    { id: 'kids-002', name: 'Vibrant Summer Casual Set',     category: 'kids', sub: 'Casual Outfits',   price: 799,  image: IMG.kidsSet, badge: 'Bestseller',  added: '2026-10-10', description: 'A colourful top-and-shorts set that is comfortable for school holidays and outings.' },
    { id: 'kids-003', name: 'Joyful Casual Co-ord Sets',    category: 'kids', sub: 'Casual Outfits',   price: 850,  image: IMG.kids,    badge: 'New Arrival', added: '2026-10-24', description: 'Matching co-ord set made from soft fabric with an easy elastic waist.' },
    { id: 'kids-004', name: 'Pink Party Frock',              category: 'kids', sub: 'Frocks',           price: 999,  image: null,        added: '2026-09-14', description: 'A twirly party frock with a layered skirt, perfect for birthdays and get-togethers.' },
    { id: 'kids-005', name: 'Cotton Printed Frock',          category: 'kids', sub: 'Frocks',           price: 599,  image: null,        added: '2026-08-12', description: 'Simple, breathable cotton frock for everyday wear.' },
    { id: 'kids-006', name: 'Boys Festive Kurta Pyjama Set', category: 'kids', sub: 'Festive Clothing', price: 1299, image: null,        badge: 'New Arrival', added: '2026-10-19', description: 'Festive kurta-pyjama set for boys with a neat collar and comfortable fit.' },

    // ---- Ethnic Wear ----
    { id: 'ethnic-001', name: 'Cotton Silk Men\'s Kurta',     category: 'ethnic', sub: 'Kurtas',           price: 1499, image: IMG.ethnic, added: '2026-09-25', description: 'Elegant straight kurta in a cotton-silk blend, ideal for festivals and family functions.' },
    { id: 'ethnic-002', name: 'Printed Festive Kurta Set',    category: 'ethnic', sub: 'Kurtas',           price: 1899, image: null,       badge: 'New Arrival', added: '2026-10-21', description: 'Kurta and pyjama set with a tasteful print for festive occasions.' },
    { id: 'ethnic-003', name: 'Embroidered Ivory Sherwani',   category: 'ethnic', sub: 'Sherwanis',        price: 6999, image: null,       added: '2026-08-20', description: 'Ivory sherwani with fine embroidery for weddings and special celebrations.' },
    { id: 'ethnic-004', name: 'Crimson Banarasi Silk Saree',  category: 'ethnic', sub: 'Sarees',           price: 3499, image: IMG.saree,  badge: 'New Arrival',  added: '2026-10-08', description: 'A rich crimson saree in a Banarasi-style weave with a woven zari-look border.' },
    { id: 'ethnic-005', name: 'Festive Georgette Saree',      category: 'ethnic', sub: 'Sarees',           price: 2799, image: null,       added: '2026-09-01', description: 'Flowing georgette saree with a graceful drape for festive evenings.' },
    { id: 'ethnic-006', name: 'Embroidered Festive Lehenga',  category: 'ethnic', sub: 'Lehengas',         price: 8999, image: null,       badge: 'New Arrival', added: '2026-10-26', description: 'Three-piece lehenga set with embroidery and a matching dupatta for celebrations.' },
    { id: 'ethnic-007', name: 'Bandhani Print Lehenga Set',   category: 'ethnic', sub: 'Lehengas',         price: 5499, image: null,       added: '2026-08-28', description: 'Rajasthani-inspired bandhani-print lehenga set with a lively colour palette.' },
    { id: 'ethnic-008', name: 'Traditional Anarkali Suit',    category: 'ethnic', sub: 'Traditional Suits',price: 3299, image: null,       added: '2026-09-16', description: 'Floor-length Anarkali suit with a matching dupatta and a classic traditional look.' },

    // ---- Winter Wear ----
    { id: 'winter-001', name: 'Quilted Navy Winter Jacket',   category: 'winter', sub: 'Jackets',     price: 2499, image: IMG.bomber, badge: 'Bestseller',  added: '2026-10-14', description: 'Warm quilted jacket in navy with a zip front and cosy lining for cold Rajasthan mornings.' },
    { id: 'winter-002', name: 'Padded Puffer Jacket',         category: 'winter', sub: 'Jackets',     price: 2999, image: IMG.winter, added: '2026-10-02', description: 'Lightweight padded jacket designed to keep the chill out.' },
    { id: 'winter-003', name: 'Wool-Blend Round-Neck Sweater',category: 'winter', sub: 'Sweaters',    price: 1199, image: null,       added: '2026-09-26', description: 'Soft knit sweater with a classic round neck for layering.' },
    { id: 'winter-004', name: 'Cable-Knit Pullover Sweater',  category: 'winter', sub: 'Sweaters',    price: 1399, image: null,       badge: 'New Arrival', added: '2026-10-23', description: 'Textured cable-knit pullover that is warm and stylish.' },
    { id: 'winter-005', name: 'Maroon Zip-Up Hoodie',         category: 'winter', sub: 'Hoodies',     price: 1299, image: null,       added: '2026-10-06', description: 'Fleece-lined zip-up hoodie with kangaroo pockets for easy winter layering.' },
    { id: 'winter-006', name: 'Pullover Hooded Sweatshirt',   category: 'winter', sub: 'Hoodies',     price: 1099, image: null,       added: '2026-09-12', description: 'Relaxed pullover hoodie with a soft brushed interior.' },
    { id: 'winter-007', name: 'Grey Fleece Sweatshirt',       category: 'winter', sub: 'Sweatshirts', price: 899,  image: null,       added: '2026-08-25', description: 'Comfortable round-neck sweatshirt in soft fleece for everyday winter wear.' },
    { id: 'winter-008', name: 'Kids Hooded Winter Jacket',    category: 'winter', sub: 'Jackets',     price: 1599, image: null,       badge: 'New Arrival', added: '2026-10-27', description: 'Warm hooded jacket sized for kids with easy zip closure.' }
  ];

  window.SRG_DEMO = { CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS };
})();
