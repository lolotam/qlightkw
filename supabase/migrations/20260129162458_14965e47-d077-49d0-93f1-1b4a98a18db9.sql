-- Create bucket for blog and project images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for blog images
CREATE POLICY "Public read access for blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Allow admin to upload blog images
CREATE POLICY "Admin can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND (SELECT public.is_admin()));

-- Allow admin to delete blog images
CREATE POLICY "Admin can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND (SELECT public.is_admin()));

-- Allow public read access for project images
CREATE POLICY "Public read access for project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Allow admin to manage project images
CREATE POLICY "Admin can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images' AND (SELECT public.is_admin()));

CREATE POLICY "Admin can delete project images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images' AND (SELECT public.is_admin()));

-- Insert 8 projects with real lighting installation scenarios
INSERT INTO projects (title_en, title_ar, slug, description_en, description_ar, client_name, location, is_active, is_featured) VALUES
('Modern Villa Living Room', 'غرفة معيشة فيلا حديثة', 'villa-living-room-salmiya',
'Complete lighting installation for a luxury villa in Salmiya. The project included recessed LED downlights, cove lighting with warm LED strips, and accent wall sconces. Our team installed over 40 light fixtures to create the perfect ambient atmosphere.',
'تركيب إضاءة كامل لفيلا فاخرة في السالمية. شمل المشروع تركيب إضاءات غائرة LED، إضاءة زاوية مع شرائط LED دافئة، وإضاءات جدارية مميزة. قام فريقنا بتركيب أكثر من 40 وحدة إضاءة لخلق أجواء مثالية.',
'Al-Sabah Family', 'Salmiya, Kuwait', true, true),

('Beauty Salon Professional Lighting', 'إضاءة صالون تجميل احترافية', 'beauty-salon-hawally',
'Professional lighting design and installation for a high-end beauty salon in Hawally. Features LED mirror lighting for precise makeup application, track spotlights for styling stations, and ambient ceiling cove lighting.',
'تصميم وتركيب إضاءة احترافية لصالون تجميل راقي في حولي. يتميز بإضاءة مرايا LED للمكياج الدقيق، وكشافات متحركة لمحطات التصفيف، وإضاءة سقف محيطية.',
'Glamour Beauty Center', 'Hawally, Kuwait', true, true),

('Master Bedroom Lighting Design', 'تصميم إضاءة غرفة نوم رئيسية', 'master-bedroom-mishref',
'Elegant bedroom lighting installation featuring pendant bedside lights, LED strip under the bed for floating effect, cove lighting in the ceiling, and dimmable controls for creating the perfect mood.',
'تركيب إضاءة غرفة نوم أنيقة تتميز بمعلقات جانبية، شريط LED تحت السرير لتأثير الطفو، إضاءة زاوية في السقف، وتحكم بالتعتيم لخلق الأجواء المثالية.',
'Private Residence', 'Mishref, Kuwait', true, true),

('Modern Kitchen Lighting', 'إضاءة مطبخ عصري', 'modern-kitchen-salwa',
'Comprehensive kitchen lighting project with layered lighting design. Includes pendant lights over the island, under-cabinet LED strips for task lighting, recessed ceiling fixtures, and cove lighting around the perimeter.',
'مشروع إضاءة مطبخ شامل بتصميم طبقات إضاءة. يشمل معلقات فوق الجزيرة، شرائط LED تحت الخزائن للإضاءة العملية، وحدات سقف غائرة، وإضاءة زاوية حول المحيط.',
'Al-Mutawa Family', 'Salwa, Kuwait', true, true),

('Grand Majlis Chandelier Installation', 'تركيب ثريا مجلس فخم', 'majlis-chandelier-jabriya',
'Spectacular chandelier installation in a grand majlis hall. Our team used scaffolding to safely install a massive crystal chandelier, along with wall sconces and cove lighting to complement the luxury Arabian interior.',
'تركيب ثريا مذهل في قاعة مجلس فخم. استخدم فريقنا سقالات لتركيب ثريا كريستال ضخمة بأمان، مع إضاءات جدارية وإضاءة زاوية لتكمل الديكور العربي الفاخر.',
'Al-Khalid Palace', 'Jabriya, Kuwait', true, true),

('Restaurant Ambient Lighting', 'إضاءة مطعم محيطية', 'restaurant-lighting-city',
'Complete lighting solution for a fine dining restaurant in Kuwait City. Designed with Moroccan-style pendant lights, wall sconces, and LED strip under banquette seating to create an inviting warm atmosphere.',
'حل إضاءة كامل لمطعم راقي في مدينة الكويت. مصمم بمعلقات على الطراز المغربي، إضاءات جدارية، وشريط LED تحت المقاعد لخلق أجواء دافئة وجذابة.',
'Layali Restaurant', 'Kuwait City', true, true),

('Villa Garden Landscape Lighting', 'إضاءة حديقة فيلا', 'garden-outdoor-fintas',
'Outdoor lighting project for a villa garden in Fintas. Installed pathway bollard lights, tree uplighting on palm trees, pool area illumination, and facade wall washers for a stunning nighttime appearance.',
'مشروع إضاءة خارجية لحديقة فيلا في الفنطاس. تم تركيب أعمدة إضاءة الممرات، إضاءة النخيل من الأسفل، إنارة منطقة المسبح، وغسالات حائط الواجهة لمظهر ليلي مذهل.',
'Private Residence', 'Fintas, Kuwait', true, true),

('Corporate Office Lighting', 'إضاءة مكتب شركة', 'office-lighting-shuwaikh',
'Professional office lighting installation for a corporate headquarters in Shuwaikh. Features linear LED panel lights, individual task lighting, and glass partition accent lighting for a modern productive workspace.',
'تركيب إضاءة مكتب احترافي لمقر شركة في الشويخ. يتميز بلوحات LED خطية، إضاءة مهام فردية، وإضاءة فواصل زجاجية لمساحة عمل حديثة ومنتجة.',
'Tech Solutions Co.', 'Shuwaikh, Kuwait', true, true);