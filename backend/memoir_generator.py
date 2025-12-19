from fpdf import FPDF
from fpdf.enums import XPos, YPos
import datetime
from typing import List, Tuple
import os

class MemoirPDF(FPDF):
    def header(self):
        # Logo or Title
        self.set_font('Helvetica', 'B', 15)
        self.set_text_color(40, 53, 147) # Deep Blue
        self.cell(0, 10, 'Memoria: Your Digital Heirloom', align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Page {self.page_no()} | Generated on {datetime.date.today().strftime("%B %d, %Y")}', align='C', new_x=XPos.RIGHT, new_y=YPos.TOP)

class MemoirGenerator:
    def __init__(self, output_dir: str = "exports"):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def generate(self, user_name: str, fragments: List[Tuple[str, str, str]]) -> str:
        """
        Generates a styled PDF from fragments.
        fragments: List of (category, content, context)
        """
        pdf = MemoirPDF()
        pdf.add_page()
        
        # Title Page
        pdf.ln(40)
        pdf.set_font('Helvetica', 'B', 24)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(0, 20, f"The Life Stories of", align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font('Helvetica', 'B', 32)
        pdf.set_text_color(37, 99, 235) # Blue-600
        pdf.cell(0, 20, user_name, align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        pdf.ln(20)
        pdf.set_font('Helvetica', 'I', 12)
        pdf.set_text_color(100)
        # multi_cell needs a defined width for wrapping
        pdf.multi_cell(190, 10, "A collection of memories, moments, and wisdom captured through conversation.", align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        pdf.add_page()
        
        # Group by Category (simplified)
        categories = {}
        for cat, content, ctx, *rest in fragments: # rest for compatibility with embedding blobs if passed
            if cat not in categories:
                categories[cat] = []
            categories[cat].append((content, ctx))
            
        # Draw Content
        for cat, items in categories.items():
            pdf.ln(10)
            pdf.set_font('Helvetica', 'B', 16)
            pdf.set_text_color(30, 41, 59)
            pdf.cell(0, 10, cat.upper(), align='L', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_draw_color(37, 99, 235)
            pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
            pdf.ln(5)
            
            for content, ctx in items:
                pdf.set_font('Helvetica', 'B', 12)
                pdf.set_text_color(15, 23, 42)
                pdf.multi_cell(190, 8, content, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                
                if ctx:
                    pdf.set_font('Helvetica', 'I', 10)
                    pdf.set_text_color(100)
                    pdf.multi_cell(190, 6, f"Context: {ctx}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                
                pdf.ln(5)
        
        filename = f"Memoir_{user_name.replace(' ', '_')}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        pdf.output(filepath)
        return filepath

# Test local generation
if __name__ == "__main__":
    gen = MemoirGenerator("test_exports")
    test_frags = [
        ("Childhood", "I remember the smell of fresh bread from my grandmother's bakery in Odense.", "Discussing early memories in Denmark"),
        ("Career", "My first job was as a deckhand on a fishing boat in the North Sea.", "Talking about early work life"),
        ("Family", "Meeting my wife, Maria, at the town dance in 1968 was the best day of my life.", "Sharing the story of how he met his spouse")
    ]
    path = gen.generate("Lasse Stilvang", test_frags)
    print(f"PDF generated at: {path}")
