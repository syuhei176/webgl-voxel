import os
import sys
from slimit import minify

modulelist = ['core']

def encode_module(input_path, output_path):
    for m in modulelist:
        listingfile(m, input_path, output_path)
        
def listingfile(m, input_path, output_path):
    content = ''
    out = ''
    for f in os.listdir(input_path+m):
        print 'm='+m+',f='+f
        filepath = input_path + m + '/' + f
        if os.path.isfile(filepath):
            fd = open(filepath, 'r')
            content = ''
            for line in fd:
                content += line
            fd.close()
            out +=  minify(content, mangle=True)
            out += '\n'
    #out =  minify(content, mangle=True)
    f = open(output_path+m+'.min.js', 'w')
    f.write('/* Copyright (C) 2013 Syuhei Hiya. All Rights Reserved. */'+out)
    f.close()
    return out

if __name__ == '__main__':
    argvs = sys.argv
    argc = len(argvs)
    if argc == 1:
        dir_path = os.path.dirname(argvs[0])
        encode_module(dir_path + '/../public/javascripts/dev/', dir_path + '/../public/javascripts/')
    if argc == 2:
        dir_path = os.path.dirname(argvs[0])
        encode_module(dir_path + '/../public/javascripts/dev/', dir_path + '/../public/javascripts/')
    print 'success!!'
