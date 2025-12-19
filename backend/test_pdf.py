import pytest
import os
from memoir_generator import MemoirGenerator

def test_pdf_generation():
    output_dir = "test_outputs"
    gen = MemoirGenerator(output_dir)
    test_frags = [
        ("Test Category", "Test Content", "Test Context")
    ]
    
    path = gen.generate("Test User", test_frags)
    
    # Verify file exists
    assert os.path.exists(path)
    assert path.endswith(".pdf")
    
    # Cleanup
    os.remove(path)
    if not os.listdir(output_dir):
        os.rmdir(output_dir)

def test_pdf_grouping():
    # Verify that multi-line content doesn't crash (we fixed this earlier)
    gen = MemoirGenerator("test_outputs_grouping")
    long_content = "This is a very long sentence that should definitely trigger the multi_cell wrapping logic in the PDF generator to ensure that our fix for the horizontal space exception is working correctly across all pages."
    test_frags = [
        ("Category A", "Short content", "Context"),
        ("Category A", long_content, "Context 2")
    ]
    
    path = gen.generate("Long Content User", test_frags)
    assert os.path.exists(path)
    
    # Cleanup
    os.remove(path)
    os.rmdir("test_outputs_grouping")
